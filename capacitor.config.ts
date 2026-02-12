import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goutguard.app',
  appName: 'GoutGuard',
  webDir: 'out',
  server: {
    url: 'https://goutguard.vercel.app',
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#1a56db',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'GoutGuard',
  },
};

export default config;
