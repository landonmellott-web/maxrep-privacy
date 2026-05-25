import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
)

export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
  annual: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID || 'price_annual',
}

export async function redirectToCheckout(
  priceId: string,
  userId: string,
  email: string
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, userId, email },
  })

  if (error || !data?.url) {
    console.error('[Stripe] checkout error:', error)
    throw new Error('Failed to create checkout session')
  }

  window.location.href = data.url
}

export async function openCustomerPortal(customerId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { customerId },
  })

  if (error || !data?.url) {
    console.error('[Stripe] portal error:', error)
    throw new Error('Failed to open customer portal')
  }

  window.location.href = data.url
}

export { stripePromise }
