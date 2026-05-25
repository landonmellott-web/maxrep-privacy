import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

// ─── Native Push (iOS via Capacitor) ─────────────────────────────────────

async function registerNativePush(userId: string): Promise<void> {
  // Dynamic import so the web build doesn't break if the plugin is missing
  const { PushNotifications } = await import('@capacitor/push-notifications')

  // Check / request permission
  let permStatus = await PushNotifications.checkPermissions()
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions()
  }
  if (permStatus.receive !== 'granted') return

  await PushNotifications.register()

  // One-time listener: capture the APNs token and store in Supabase
  PushNotifications.addListener('registration', async (token) => {
    console.log('[Push] APNs token:', token.value)
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: token.value,
        p256dh: '',   // not used for native APNs
        auth: '',     // not used for native APNs
        platform: 'ios',
      },
      { onConflict: 'user_id,endpoint' }
    )
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push] registration error:', err)
  })
}

// ─── Web Push (browser) ───────────────────────────────────────────────────

async function registerWebPush(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Replace with your VAPID public key from `npx web-push generate-vapid-keys`
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    })

    const json = sub.toJSON()
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        platform: 'web',
      },
      { onConflict: 'user_id,endpoint' }
    )
  } catch (e) {
    console.error('[Push] web push registration error:', e)
  }
}

// ─── Unified API ─────────────────────────────────────────────────────────

/**
 * Call after a positive moment (e.g. after profile reveal or first check-in).
 * Automatically uses native APNs on iOS, web push in browsers.
 */
export async function requestPushPermission(userId: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await registerNativePush(userId)
  } else {
    await registerWebPush(userId)
  }
}

/**
 * Returns true if push permission is already granted.
 */
export async function hasPushPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const status = await PushNotifications.checkPermissions()
    return status.receive === 'granted'
  }
  return 'Notification' in window && Notification.permission === 'granted'
}
