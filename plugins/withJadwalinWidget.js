// ============================================
// Jadwalin App — Widget Config Plugin (Android)
// Injects the native widget configuration into 
// AndroidManifest.xml during `expo prebuild`.
// ============================================

const { withAndroidManifest } = require('expo/config-plugins');

/**
 * This plugin registers our JadwalinWidgetProvider as a
 * <receiver> in AndroidManifest.xml so Android knows
 * about our homescreen widget.
 */
function withJadwalinWidget(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) {
      console.warn('[JadwalinWidget] No <application> tag found in manifest');
      return config;
    }

    // Ensure receivers array exists
    if (!application.receiver) {
      application.receiver = [];
    }

    // Check if our widget receiver is already registered
    const widgetReceiverExists = application.receiver.some(
      (r) => r.$?.['android:name'] === '.widget.JadwalinWidgetProvider'
    );

    if (!widgetReceiverExists) {
      // Add the widget receiver to AndroidManifest
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

module.exports = withJadwalinWidget;
