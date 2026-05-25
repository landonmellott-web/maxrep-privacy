import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function setStatus(customerId: string, status: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: status, updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', customerId)
  if (error) console.error('[webhook] setStatus error:', error.message)
}

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  console.log('[webhook] event:', event.type)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      let status: string
      switch (sub.status) {
        case 'trialing':   status = 'trialing'; break
        case 'active':     status = 'active';   break
        case 'past_due':   status = 'past_due'; break
        case 'canceled':
        case 'unpaid':
        case 'incomplete_expired':
          status = 'canceled'; break
        default:           status = 'free'
      }
      await setStatus(customerId, status)

      // Store price ID on the profile for reference
      const priceId = sub.items.data[0]?.price?.id
      if (priceId) {
        await supabase
          .from('profiles')
          .update({ stripe_price_id: priceId })
          .eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await setStatus(sub.customer as string, 'canceled')
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await setStatus(invoice.customer as string, 'active')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await setStatus(invoice.customer as string, 'past_due')
      }
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      if (session.mode === 'subscription' && session.subscription) {
        const customerId = session.customer as string
        const userId = session.metadata?.userId
        if (userId) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
        }
        // Status will be set by the subscription.created event that follows
      }
      break
    }

    default:
      // Ignore unhandled events
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
