// ============================================
// Jadwalin App – Widget Config Plugin (Android)
// 1. Injects widget receiver into AndroidManifest.xml
// 2. Generates xml/jadwalin_widget_info.xml resource file
// 3. Forces minSdkVersion = 24 (override expo-root-project)
// ============================================

const { withAndroidManifest, withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ── 1. Generate jadwalin_widget_info.xml ──────────────────────────────────────
function withWidgetXmlFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );

      // Ensure folder exists
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      const xmlPath = path.join(xmlDir, 'jadwalin_widget_info.xml');
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="40dp"
    android:minHeight="40dp"
    android:updatePeriodMillis="86400000"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>`;

      fs.writeFileSync(xmlPath, xmlContent, 'utf8');
      console.log('[JadwalinWidget] ✅ jadwalin_widget_info.xml generated at', xmlPath);

      return config;
    },
  ]);
}

// ── 2. Inject widget receiver into AndroidManifest ────────────────────────────
function withWidgetManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) {
      console.warn('[JadwalinWidget] No <application> tag found in manifest');
      return config;
    }

    if (!application.receiver) {
      application.receiver = [];
    }

    const widgetReceiverExists = application.receiver.some(
      (r) => r.$?.['android:name'] === '.widget.JadwalinWidgetProvider'
    );

    if (!widgetReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': '.widget.JadwalinWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/jadwalin_widget_info',
            },
          },
        ],
      });

      console.log('[JadwalinWidget] ✅ Widget receiver added to AndroidManifest');
    }

    return config;
  });
}

// ── 3. Force minSdkVersion = 24 in app/build.gradle ──────────────────────────
function withMinSdkFix(config) {
  return withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;

    // Replace any minSdkVersion assignment (rootProject.ext or hardcoded)
    const fixed = gradle
      .replace(
        /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
        'minSdkVersion 24'
      )
      .replace(
        /minSdkVersion\s*=?\s*\d+/g,
        'minSdkVersion 24'
      );

    config.modResults.contents = fixed;
    console.log('[JadwalinWidget] ✅ minSdkVersion forced to 24 in app/build.gradle');
    return config;
  });
}

// ── Main plugin ───────────────────────────────────────────────────────────────
function withJadwalinWidget(config) {
  config = withWidgetXmlFile(config);
  config = withWidgetManifest(config);
  config = withMinSdkFix(config);
  return config;
}

module.exports = withJadwalinWidget;