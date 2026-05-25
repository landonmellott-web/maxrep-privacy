import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mindmuscle.app',
  appName: 'MindMuscle',
  webDir: 'dist',
  bundledWebRuntime: false,

  // In dev: point to your local Vite server so you get hot-reload on device
  // Comment this out for production builds
  // server: { url: 'http://YOUR_LOCAL_IP:5173', cleartext: true },

  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#0A0A0B',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0A0A0B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0B',
      overlaysWebView: false,
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
