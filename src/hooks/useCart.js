import { useState, useEffect } from 'react'
import { getCart, saveCart, addToCart as addToCartUtil, removeFromCart as removeFromCartUtil, updateCartItemQuantity as updateCartItemQuantityUtil, clearCart as clearCartUtil, getCartTotal } from '../lib/cart'

export const useCart = () => {
  const [cart, setCart] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const savedCart = getCart()
    setCart(savedCart)
    setTotal(getCartTotal(savedCart))
  }, [])

  const addToCart = (item) => {
    const newCart = addToCartUtil(item)
    setCart(newCart)
    setTotal(getCartTotal(newCart))
  }

  const removeFromCart = (variantId) => {
    const newCart = removeFromCartUtil(variantId)
    setCart(newCart)
    setTotal(getCartTotal(newCart))
  }

  const updateQuantity = (variantId, quantity) => {
    const newCart = updateCartItemQuantityUtil(variantId, quantity)
    setCart(newCart)
    setTotal(getCartTotal(newCart))
  }

  const clearCart = () => {
    const newCart = clearCartUtil()
    setCart(newCart)
    setTotal(0)
  }

  return {
    cart,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  }
}
