module.exports = {
  name: "Jadwalin",
  slug: "JadwalinApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "jadwalinapp",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.candalena.JadwalinApp",
  },
  web: {
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/spalsh.png",
        imageWidth: 260,
        resizeMode: "contain",
        backgroundColor: "#6A3DE8",
        dark: {
          backgroundColor: "#6A3DE8",
        },
      },
    ],
    "@react-native-community/datetimepicker",
    // expo-build-properties MUST come before withJadwalinWidget
    // so that ext.minSdkVersion is set before our plugin overrides subprojects
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
      },
    ],
    // "@react-native-google-signin/google-signin" — replaced by expo-auth-session
    "./plugins/withJadwalinWidget",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "612b98a8-f0c7-4611-a5c4-b3720545d64b",
    },
  },
  owner: "candalena",
};

