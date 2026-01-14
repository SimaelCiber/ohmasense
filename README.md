# OhmaSense - Perfumería

Aplicación completa de e-commerce para perfumería construida con React, Vite, TailwindCSS, HeroUI, Supabase y Stripe.

## 🚀 Stack Tecnológico

### Frontend
- **Vite + React (JSX)**: Framework principal
- **TailwindCSS**: Estilos
- **HeroUI**: Componentes UI
- **TanStack Router**: Enrutamiento file-based
- **TanStack Query**: Gestión de estado y caché
- **TanStack Table**: Tablas de datos
- **Supabase**: Autenticación y base de datos
- **Stripe**: Procesamiento de pagos

### Backend
- **Node.js + Express**: Servidor API
- **Stripe Webhooks**: Procesamiento de eventos de pago
- **Supabase**: Base de datos PostgreSQL y autenticación

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Stripe

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/SimaelCiber/ohmasense.git
cd ohmasense
```

### 2. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a SQL Editor y ejecuta el contenido del archivo `supabase/schema.sql`
3. Copia las credenciales de tu proyecto:
   - URL del proyecto
   - Anon key (clave pública)
   - Service role key (clave secreta - solo para el servidor)

### 3. Configurar Frontend

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
# VITE_SUPABASE_URL=tu-url-de-supabase
# VITE_SUPABASE_ANON_KEY=tu-anon-key
# VITE_STRIPE_PUBLIC_KEY=tu-clave-publica-stripe
# VITE_SERVER_URL=http://localhost:3001
```

### 4. Configurar Backend (Servidor)

```bash
cd server

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
# SUPABASE_URL=tu-url-de-supabase
# SUPABASE_SERVICE_KEY=tu-service-role-key
# STRIPE_SECRET_KEY=tu-clave-secreta-stripe
# STRIPE_WEBHOOK_SECRET=tu-webhook-secret
# PORT=3001
# CLIENT_URL=http://localhost:5173
```

### 5. Configurar Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tus claves API (pública y secreta)
3. Configura un webhook apuntando a `http://tu-servidor/api/webhook`
4. Selecciona el evento: `checkout.session.completed`
5. Copia el webhook secret

## 🚀 Ejecutar en Desarrollo

### Terminal 1: Frontend
```bash
npm run dev
```
El frontend estará disponible en `http://localhost:5173`

### Terminal 2: Backend
```bash
cd server
npm run dev
```
El servidor estará disponible en `http://localhost:3001`

## 📦 Funcionalidades

### Público
- ✅ Catálogo de productos con búsqueda y filtros
- ✅ Filtros por marca y rango de precio
- ✅ Detalle de producto con galería de imágenes
- ✅ Variantes por tamaño (ml) con precio y stock
- ✅ Carrito persistente en localStorage
- ✅ Checkout con Stripe
- ✅ Registro e inicio de sesión

### Cliente Autenticado
- ✅ Ver historial de pedidos
- ✅ Ver detalle de pedido (ticket/recibo)
- ✅ Compartir ticket por WhatsApp
- ✅ Gestión de perfil

### Admin/Staff
- ✅ CRUD de productos
- ✅ Gestión de variantes (tamaños)
- ✅ Gestión de imágenes de productos
- ✅ Vista de todos los pedidos
- ✅ Vista de movimientos de inventario
- ✅ Stock actualizado automáticamente

## 🗄️ Estructura de la Base de Datos

### Tablas Principales
- `profiles`: Perfiles de usuario con roles (customer, staff, admin)
- `products`: Productos con información base
- `product_variants`: Variantes por tamaño (ml) con precio y stock
- `product_images`: Galería de imágenes por producto
- `orders`: Pedidos con información del cliente
- `order_items`: Items de cada pedido
- `inventory_movements`: Movimientos de inventario (in/out/adjustment)

### Triggers
- Creación automática de perfil al registrar usuario
- Actualización automática de stock al crear movimiento de inventario

### RLS Policies
- Lectura pública de productos activos
- Admin/Staff: acceso total a gestión
- Usuarios: solo ven sus propios pedidos

## 🔐 Roles de Usuario

- **customer**: Cliente regular (por defecto)
- **staff**: Personal con acceso a gestión
- **admin**: Administrador con acceso total

Para cambiar el rol de un usuario, edita directamente en la tabla `profiles` de Supabase.

## 💳 Flujo de Pago

1. Cliente agrega productos al carrito
2. Procede al checkout e ingresa información
3. Se crea el pedido en estado "pending"
4. Se redirige a Stripe Checkout
5. Al completar el pago, Stripe envía webhook
6. El webhook marca el pedido como "paid"
7. Se crean movimientos de inventario "out" para cada item
8. El stock se actualiza automáticamente via trigger

## 📱 Compartir Ticket por WhatsApp

Los clientes pueden compartir el detalle de su pedido directamente por WhatsApp con un solo clic desde la página del pedido.

## 🌐 Despliegue a Producción

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy la carpeta dist/
```

### Backend (Railway/Render)
```bash
cd server
# Deploy con las variables de entorno configuradas
```

### Configurar Variables de Entorno
Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue según los archivos `.env.example`.

## 🛡️ Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Validación de roles en frontend y backend
- ✅ Service key solo en servidor
- ✅ Webhooks verificados con signature
- ✅ No se exponen secretos en el frontend

## 📝 Notas Adicionales

- Moneda: MXN (Pesos Mexicanos)
- Idioma: Español
- Formato de fecha: ES-MX

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
