-- Ohmasense Perfumería - Schema SQL Consolidado

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de variantes de producto (por tamaño en ml)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size_ml INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size_ml)
);

-- Tabla de imágenes de producto
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_whatsapp TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para aplicar movimientos de inventario al stock
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE product_variants
    SET stock = stock + NEW.quantity
    WHERE id = NEW.variant_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE product_variants
    SET stock = NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_inventory_movement_created ON inventory_movements;
CREATE TRIGGER on_inventory_movement_created
  AFTER INSERT ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES PARA PROFILES
-- ============================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (excepto role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin/staff pueden ver todos los perfiles
CREATE POLICY "Admin/staff can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin puede actualizar cualquier perfil
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- POLICIES PARA PRODUCTS
-- ============================================================

-- Lectura pública solo de productos activos
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Admin/staff pueden ver todos los productos
CREATE POLICY "Admin/staff can view all products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden insertar productos
CREATE POLICY "Admin/staff can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden actualizar productos
CREATE POLICY "Admin/staff can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden eliminar productos
CREATE POLICY "Admin/staff can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- POLICIES PARA PRODUCT_VARIANTS
-- ============================================================

-- Lectura pública de variantes de productos activos
CREATE POLICY "Public can view variants of active products"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id AND products.is_active = true
    )
  );

-- Admin/staff pueden ver todas las variantes
CREATE POLICY "Admin/staff can view all variants"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden insertar variantes
CREATE POLICY "Admin/staff can insert variants"
  ON product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden actualizar variantes
CREATE POLICY "Admin/staff can update variants"
  ON product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden eliminar variantes
CREATE POLICY "Admin/staff can delete variants"
  ON product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- POLICIES PARA PRODUCT_IMAGES
-- ============================================================

-- Lectura pública de imágenes de productos activos
CREATE POLICY "Public can view images of active products"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id AND products.is_active = true
    )
  );

-- Admin/staff pueden ver todas las imágenes
CREATE POLICY "Admin/staff can view all images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden insertar imágenes
CREATE POLICY "Admin/staff can insert images"
  ON product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden actualizar imágenes
CREATE POLICY "Admin/staff can update images"
  ON product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden eliminar imágenes
CREATE POLICY "Admin/staff can delete images"
  ON product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- POLICIES PARA ORDERS
-- ============================================================

-- Los usuarios pueden ver solo sus propios pedidos
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/staff pueden ver todos los pedidos
CREATE POLICY "Admin/staff can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Los usuarios autenticados pueden crear pedidos
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin/staff pueden actualizar pedidos
CREATE POLICY "Admin/staff can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- POLICIES PARA ORDER_ITEMS
-- ============================================================

-- Los usuarios pueden ver items de sus propios pedidos
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- Admin/staff pueden ver todos los items
CREATE POLICY "Admin/staff can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Los usuarios autenticados pueden crear items (al crear pedidos)
CREATE POLICY "Authenticated users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES PARA INVENTORY_MOVEMENTS
-- ============================================================

-- Admin/staff pueden ver todos los movimientos
CREATE POLICY "Admin/staff can view all inventory movements"
  ON inventory_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden crear movimientos
CREATE POLICY "Admin/staff can create inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden actualizar movimientos
CREATE POLICY "Admin/staff can update inventory movements"
  ON inventory_movements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin/staff pueden eliminar movimientos
CREATE POLICY "Admin/staff can delete inventory movements"
  ON inventory_movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );
