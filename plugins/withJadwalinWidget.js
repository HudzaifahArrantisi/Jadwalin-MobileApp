// ============================================
// Jadwalin App – Config Plugin (Android)
//
// This plugin handles ALL Android build fixes:
//   1. Generates xml/jadwalin_widget_info.xml
//   2. Injects widget receiver into AndroidManifest.xml
//   3. Forces minSdkVersion = 24 in app/build.gradle
//   4. Forces minSdkVersion = 24 in root build.gradle (subprojects + CMake)
//   5. Locks Gradle wrapper to 8.13
//   6. Fixes gradle.properties to prevent metadata.bin corruption
// ============================================

const {
  withAndroidManifest,
  withAppBuildGradle,
  withProjectBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');
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
      console.log('[JadwalinWidget] ✅ jadwalin_widget_info.xml generated');

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
function withMinSdkInAppGradle(config) {
  return withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;

    // Replace any minSdkVersion reference (rootProject.ext or hardcoded number)
    gradle = gradle
      .replace(
        /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
        'minSdkVersion 24'
      )
      .replace(
        /minSdkVersion\s+\d+/g,
        'minSdkVersion 24'
      );

    config.modResults.contents = gradle;
    console.log('[JadwalinWidget] ✅ minSdkVersion forced to 24 in app/build.gradle');
    return config;
  });
}

// ── 4. Force minSdkVersion = 24 in root build.gradle (subprojects + CMake) ───
function withMinSdkInRootGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;

    // The subprojects block forces minSdkVersion 24 on all library/app modules.
    // Uses plugins.withType which fires at plugin-apply time (never "already evaluated").
    // Also sets cmake ANDROID_PLATFORM via externalNativeBuild for CMake-based libs.
    const subprojectsBlock = `
// ── Jadwalin: Force minSdkVersion 24 on ALL subprojects (libraries + CMake) ──
subprojects {
    plugins.withType(com.android.build.gradle.LibraryPlugin) {
        android {
            if (defaultConfig.minSdkVersion == null || defaultConfig.minSdkVersion.apiLevel < 24) {
                defaultConfig.minSdkVersion 24
            }
            // Force CMake-level minimum API to 24
            defaultConfig.externalNativeBuild {
                cmake {
                    arguments "-DANDROID_PLATFORM=android-24"
                }
            }
        }
    }
    plugins.withType(com.android.build.gradle.AppPlugin) {
        android {
            if (defaultConfig.minSdkVersion == null || defaultConfig.minSdkVersion.apiLevel < 24) {
                defaultConfig.minSdkVersion 24
            }
        }
    }
}
`;

    // Remove any existing Jadwalin subprojects blocks to avoid duplicates
    gradle = gradle.replace(
      /\/\/ ── Jadwalin: Force minSdkVersion[\s\S]*?\n}\n/g,
      ''
    );
    // Remove old afterEvaluate-based subprojects blocks
    gradle = gradle.replace(
      /subprojects\s*\{[\s\S]*?afterEvaluate[\s\S]*?\}\s*\}\s*\}/g,
      ''
    );
    // Remove old plugins.withId-based subprojects blocks
    gradle = gradle.replace(
      /subprojects\s*\{[\s\S]*?plugins\.withId[\s\S]*?\}\s*\}\s*\}/g,
      ''
    );

    // Append at the end of the file
    if (!gradle.includes('Jadwalin: Force minSdkVersion')) {
      gradle = gradle.trimEnd() + '\n' + subprojectsBlock;
    }

    config.modResults.contents = gradle;
    console.log('[JadwalinWidget] ✅ subprojects minSdkVersion 24 block added to root build.gradle');
    return config;
  });
}

// ── 5. Lock Gradle to 8.13 + Fix gradle.properties ───────────────────────────
function withGradleFixes(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidRoot = config.modRequest.platformProjectRoot;

      // ── 5a. Lock gradle-wrapper.properties to 8.13 ──
      const wrapperPath = path.join(androidRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties');
      if (fs.existsSync(wrapperPath)) {
        let wrapper = fs.readFileSync(wrapperPath, 'utf8');
        wrapper = wrapper.replace(
          /distributionUrl=.*gradle-[\d.]+-.*\.zip/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip'
        );
        fs.writeFileSync(wrapperPath, wrapper, 'utf8');
        console.log('[JadwalinWidget] ✅ Gradle locked to 8.13');
      }

      // ── 5b. Fix gradle.properties for metadata.bin prevention ──
      const propsPath = path.join(androidRoot, 'gradle.properties');
      if (fs.existsSync(propsPath)) {
        let props = fs.readFileSync(propsPath, 'utf8');

        // Properties to enforce (key → value)
        const fixes = {
          'org.gradle.parallel': 'false',
          'org.gradle.workers.max': '1',
          'org.gradle.caching': 'false',
          'org.gradle.vfs.watch': 'false',
          'org.gradle.configuration-cache': 'false',
          'android.minSdkVersion': '24',
        };

        for (const [key, value] of Object.entries(fixes)) {
          const regex = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=.*$`, 'm');
          if (regex.test(props)) {
            props = props.replace(regex, `${key}=${value}`);
          } else {
            props += `\n${key}=${value}`;
          }
        }

        fs.writeFileSync(propsPath, props, 'utf8');
        console.log('[JadwalinWidget] ✅ gradle.properties patched (parallel=false, caching=false, vfs.watch=false)');
      }

      return config;
    },
  ]);
}

// ── Main plugin ───────────────────────────────────────────────────────────────
function withJadwalinWidget(config) {
  config = withWidgetXmlFile(config);
  config = withWidgetManifest(config);
  config = withMinSdkInAppGradle(config);
  config = withMinSdkInRootGradle(config);
  config = withGradleFixes(config);
  return config;
}

module.exports = withJadwalinWidget;