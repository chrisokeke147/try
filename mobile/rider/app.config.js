// app.config.js (instead of app.json) so Google Maps API keys can be injected
// from .env at build time rather than committed as plain strings.
module.exports = {
  expo: {
    name: 'TRY',
    slug: 'try-rider',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'tryrider',
    userInterfaceStyle: 'dark',
    backgroundColor: '#000000',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'ng.tryride.rider',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'TRY uses your location to find your pickup point and nearby drivers.',
      },
    },
    android: {
      package: 'ng.tryride.rider',
      adaptiveIcon: {
        backgroundColor: '#000000',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'TRY uses your location to find your pickup point and nearby drivers.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '92b9fc31-b201-4cf4-8aaa-8f03ccaa44cd',
      },
    },
  },
};
