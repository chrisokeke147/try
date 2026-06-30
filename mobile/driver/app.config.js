// app.config.js (instead of app.json) so Google Maps API keys can be injected
// from .env at build time rather than committed as plain strings.
module.exports = {
  expo: {
    name: 'TRY Driver',
    slug: 'try-driver',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'trydriver',
    userInterfaceStyle: 'dark',
    backgroundColor: '#000000',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'ng.tryride.driver',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
      infoPlist: {
        NSCameraUsageDescription: 'TRY needs camera access to capture your profile photo and tricycle plate during driver verification.',
        NSPhotoLibraryUsageDescription: 'TRY needs photo library access so you can upload your profile photo and tricycle plate photo.',
        NSLocationWhenInUseUsageDescription: 'TRY verifies your operating city from your location during registration, and uses it to find nearby trip requests.',
      },
    },
    android: {
      package: 'ng.tryride.driver',
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
      [
        'expo-image-picker',
        {
          photosPermission: 'TRY needs photo library access so you can upload your profile photo and tricycle plate photo.',
          cameraPermission: 'TRY needs camera access to capture your profile photo and tricycle plate during driver verification.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'TRY verifies your operating city from your location during registration, and uses it to find nearby trip requests.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'bdad3c3a-ac79-4e48-8e74-137d8ad0322f',
      },
    },
  },
};
