import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

app.use(cors())

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('stripe_checkout_session_id', session.id)
        .single()

      if (orderError) throw orderError

      await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent,
        })
        .eq('id', order.id)

      for (const item of order.order_items) {
        await supabase
          .from('inventory_movements')
          .insert({
            variant_id: item.variant_id,
            movement_type: 'out',
            quantity: item.quantity,
            reason: `Venta - Pedido #${order.id.slice(0, 8)}`,
            order_id: order.id,
          })
      }

      console.log(`Order ${order.id} marked as paid and inventory updated`)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return res.status(500).json({ error: 'Error processing webhook' })
    }
  }

  res.json({ received: true })
})

app.use(express.json())

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { orderId, items, customerEmail } = req.body

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: `${item.productName} (${item.variantLabel})`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/orders/${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      customer_email: customerEmail,
      metadata: {
        orderId,
      },
    })

    res.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Error creating checkout session' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
