export const CART_STORAGE_KEY = 'ohmasense-cart'

export const getCart = () => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY)
    return cart ? JSON.parse(cart) : []
  } catch (error) {
    console.error('Error reading cart:', error)
    return []
  }
}

export const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Error saving cart:', error)
  }
}

export const addToCart = (item) => {
  const cart = getCart()
  const existingItem = cart.find(i => i.variantId === item.variantId)
  
  if (existingItem) {
    existingItem.quantity += item.quantity
  } else {
    cart.push(item)
  }
  
  saveCart(cart)
  return cart
}

export const removeFromCart = (variantId) => {
  const cart = getCart()
  const newCart = cart.filter(i => i.variantId !== variantId)
  saveCart(newCart)
  return newCart
}

export const updateCartItemQuantity = (variantId, quantity) => {
  const cart = getCart()
  const item = cart.find(i => i.variantId === variantId)
  
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(variantId)
    }
    item.quantity = quantity
    saveCart(cart)
  }
  
  return cart
}

export const clearCart = () => {
  saveCart([])
  return []
}

export const getCartTotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
}
