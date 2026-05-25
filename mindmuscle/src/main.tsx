import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

// iOS: configure native plugins on startup
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark })
    StatusBar.setBackgroundColor({ color: '#0A0A0B' })
  }).catch(() => {})

  import('@capacitor/splash-screen').then(({ SplashScreen }) => {
    // Hide after React mounts (short delay for first paint)
    setTimeout(() => SplashScreen.hide(), 300)
  }).catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
