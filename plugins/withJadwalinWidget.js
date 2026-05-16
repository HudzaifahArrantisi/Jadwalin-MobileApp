// ============================================
// Jadwalin App – Config Plugin (Android)
// Generates native Widget + NativeModule code
// ============================================

const {
  withAndroidManifest,
  withAppBuildGradle,
  withProjectBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const PACKAGE = 'com.candalena.JadwalinApp';
const PACKAGE_DIR = 'com/candalena/JadwalinApp';

// ── Helper: write file with dirs ──
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// ── 1. Generate widget_info.xml ──
function withWidgetXmlFile(config) {
  return withDangerousMod(config, ['android', async (config) => {
    const resDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
    
    // xml/jadwalin_widget_info.xml
    writeFile(path.join(resDir, 'xml', 'jadwalin_widget_info.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="180dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:previewLayout="@layout/widget_layout">
</appwidget-provider>`);

    // layout/widget_layout.xml — main widget layout
    writeFile(path.join(resDir, 'layout', 'widget_layout.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_bg"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginBottom="8dp">

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Jadwalin"
            android:textColor="#7C3AED"
            android:textSize="18sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/widget_week"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Minggu ini"
            android:textColor="#6B7280"
            android:textSize="11sp" />
    </LinearLayout>

    <TextView android:layout_width="match_parent" android:layout_height="1dp" android:background="#E5E7EB" android:layout_marginBottom="8dp" />

    <ListView
        android:id="@+id/widget_list"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:divider="@android:color/transparent"
        android:dividerHeight="4dp"
        android:scrollbars="none" />

    <TextView
        android:id="@+id/widget_empty"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:gravity="center"
        android:text="Tidak ada jadwal minggu ini"
        android:textColor="#9CA3AF"
        android:textSize="13sp"
        android:visibility="gone" />
</LinearLayout>`);

    // layout/widget_item.xml — list item
    writeFile(path.join(resDir, 'layout', 'widget_item.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:background="@drawable/widget_item_bg"
    android:padding="10dp"
    android:gravity="center_vertical">

    <TextView android:id="@+id/item_dot" android:layout_width="8dp" android:layout_height="8dp" android:background="@drawable/widget_dot" android:layout_marginEnd="10dp" />

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/item_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#1F2937"
            android:textSize="13sp"
            android:textStyle="bold"
            android:maxLines="1"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/item_date"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#9CA3AF"
            android:textSize="11sp"
            android:layout_marginTop="2dp" />
    </LinearLayout>

    <TextView
        android:id="@+id/item_time"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="#7C3AED"
        android:textSize="11sp"
        android:textStyle="bold"
        android:layout_marginStart="8dp" />
</LinearLayout>`);

    // drawable/widget_bg.xml
    writeFile(path.join(resDir, 'drawable', 'widget_bg.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="20dp" />
    <stroke android:width="1dp" android:color="#E5E7EB" />
</shape>`);

    // drawable/widget_item_bg.xml
    writeFile(path.join(resDir, 'drawable', 'widget_item_bg.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#F9FAFB" />
    <corners android:radius="10dp" />
</shape>`);

    // drawable/widget_dot.xml
    writeFile(path.join(resDir, 'drawable', 'widget_dot.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#7C3AED" />
</shape>`);

    console.log('[JadwalinWidget] ✅ XML layouts + drawables generated');
    return config;
  }]);
}

// ── 2. Generate Kotlin files ──
function withKotlinFiles(config) {
  return withDangerousMod(config, ['android', async (config) => {
    const javaDir = path.join(
      config.modRequest.platformProjectRoot,
      'app', 'src', 'main', 'java', ...PACKAGE_DIR.split('/')
    );
    const widgetDir = path.join(javaDir, 'widget');

    // JadwalinWidgetProvider.kt
    writeFile(path.join(widgetDir, 'JadwalinWidgetProvider.kt'),
`package ${PACKAGE}.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import ${PACKAGE}.R

class JadwalinWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.candalena.JadwalinApp.WIDGET_UPDATE") {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, JadwalinWidgetProvider::class.java))
            for (id in ids) {
                updateWidget(context, manager, id)
            }
            manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list)
        }
    }

    companion object {
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            val prefs = context.getSharedPreferences("jadwalin_prefs", Context.MODE_PRIVATE)
            val json = prefs.getString("jadwalin_widget_data", null)

            if (json != null) {
                try {
                    val data = JSONObject(json)
                    val weekLabel = data.optString("weekLabel", "Minggu ini")
                    val tasksArray = data.optJSONArray("tasks")
                    val taskCount = tasksArray?.length() ?: 0

                    views.setTextViewText(R.id.widget_week, weekLabel)

                    if (taskCount > 0) {
                        views.setViewVisibility(R.id.widget_list, View.VISIBLE)
                        views.setViewVisibility(R.id.widget_empty, View.GONE)
                    } else {
                        views.setViewVisibility(R.id.widget_list, View.GONE)
                        views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
                    }

                    val intent = Intent(context, WidgetRemoteViewsService::class.java)
                    views.setRemoteAdapter(R.id.widget_list, intent)
                } catch (e: Exception) {
                    views.setViewVisibility(R.id.widget_list, View.GONE)
                    views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
                }
            } else {
                views.setViewVisibility(R.id.widget_list, View.GONE)
                views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}`);

    // WidgetRemoteViewsService.kt
    writeFile(path.join(widgetDir, 'WidgetRemoteViewsService.kt'),
`package ${PACKAGE}.widget

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject
import ${PACKAGE}.R

class WidgetRemoteViewsService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return WidgetRemoteViewsFactory(applicationContext)
    }
}

class WidgetRemoteViewsFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var tasks: MutableList<JSONObject> = mutableListOf()

    override fun onCreate() { loadData() }

    override fun onDataSetChanged() { loadData() }

    private fun loadData() {
        tasks.clear()
        val prefs = context.getSharedPreferences("jadwalin_prefs", Context.MODE_PRIVATE)
        val json = prefs.getString("jadwalin_widget_data", null) ?: return
        try {
            val data = JSONObject(json)
            val arr = data.optJSONArray("tasks") ?: return
            for (i in 0 until arr.length()) {
                tasks.add(arr.getJSONObject(i))
            }
        } catch (_: Exception) {}
    }

    override fun getCount(): Int = tasks.size

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_item)
        if (position < tasks.size) {
            val task = tasks[position]
            views.setTextViewText(R.id.item_title, task.optString("title", ""))
            views.setTextViewText(R.id.item_date, task.optString("date", ""))
            views.setTextViewText(R.id.item_time, task.optString("time", ""))
        }
        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
    override fun onDestroy() { tasks.clear() }
}`);

    // JadwalinWidgetModule.kt — NativeModule bridge
    writeFile(path.join(widgetDir, 'JadwalinWidgetModule.kt'),
`package ${PACKAGE}.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class JadwalinWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "JadwalinWidgetModule"

    @ReactMethod
    fun updateWidgetData(json: String) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("jadwalin_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("jadwalin_widget_data", json).apply()

        // Trigger widget refresh
        val intent = Intent("com.candalena.JadwalinApp.WIDGET_UPDATE")
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)

        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(
            ComponentName(context, JadwalinWidgetProvider::class.java)
        )
        manager.notifyAppWidgetViewDataChanged(ids, com.candalena.JadwalinApp.R.id.widget_list)
    }

    @ReactMethod
    fun clearWidgetData() {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("jadwalin_prefs", Context.MODE_PRIVATE)
        prefs.edit().remove("jadwalin_widget_data").apply()

        val intent = Intent("com.candalena.JadwalinApp.WIDGET_UPDATE")
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)
    }
}`);

    // JadwalinWidgetPackage.kt — Register native module
    writeFile(path.join(widgetDir, 'JadwalinWidgetPackage.kt'),
`package ${PACKAGE}.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class JadwalinWidgetPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(JadwalinWidgetModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}`);

    console.log('[JadwalinWidget] ✅ Kotlin files generated');
    return config;
  }]);
}

// ── 3. Register package in MainApplication ──
function withMainApplicationPatch(config) {
  return withDangerousMod(config, ['android', async (config) => {
    const mainAppPath = path.join(
      config.modRequest.platformProjectRoot,
      'app', 'src', 'main', 'java', ...PACKAGE_DIR.split('/'), 'MainApplication.kt'
    );

    if (fs.existsSync(mainAppPath)) {
      let content = fs.readFileSync(mainAppPath, 'utf8');
      const importLine = `import ${PACKAGE}.widget.JadwalinWidgetPackage`;
      const addLine = `packages.add(JadwalinWidgetPackage())`;

      if (!content.includes('JadwalinWidgetPackage')) {
        // Add import
        content = content.replace(
          /(import com\.facebook\.react\.)/,
          `${importLine}\n$1`
        );
        // Add to getPackages
        if (content.includes('getPackages()')) {
          content = content.replace(
            /(val packages = PackageList\(this\)\.packages)/,
            `$1\n            ${addLine}`
          );
        }
        fs.writeFileSync(mainAppPath, content, 'utf8');
        console.log('[JadwalinWidget] ✅ JadwalinWidgetPackage registered in MainApplication');
      }
    }
    return config;
  }]);
}

// ── 4. Inject widget receiver + service into AndroidManifest ──
function withWidgetManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    if (!application.receiver) application.receiver = [];
    if (!application.service) application.service = [];

    // Add receiver
    if (!application.receiver.some(r => r.$?.['android:name'] === '.widget.JadwalinWidgetProvider')) {
      application.receiver.push({
        $: { 'android:name': '.widget.JadwalinWidgetProvider', 'android:exported': 'true' },
        'intent-filter': [{
          action: [
            { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            { $: { 'android:name': 'com.candalena.JadwalinApp.WIDGET_UPDATE' } },
          ],
        }],
        'meta-data': [{ $: { 'android:name': 'android.appwidget.provider', 'android:resource': '@xml/jadwalin_widget_info' } }],
      });
    }

    // Add RemoteViewsService
    if (!application.service.some(s => s.$?.['android:name'] === '.widget.WidgetRemoteViewsService')) {
      application.service.push({
        $: {
          'android:name': '.widget.WidgetRemoteViewsService',
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_REMOTEVIEWS',
        },
      });
    }

    console.log('[JadwalinWidget] ✅ Manifest updated (receiver + service)');
    return config;
  });
}

// ── 5. Force minSdkVersion ──
function withMinSdkInAppGradle(config) {
  return withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;
    gradle = gradle.replace(/minSdkVersion\s+rootProject\.ext\.minSdkVersion/g, 'minSdkVersion 24');
    gradle = gradle.replace(/minSdkVersion\s+\d+/g, 'minSdkVersion 24');
    config.modResults.contents = gradle;
    return config;
  });
}

// ── 6. Force minSdk in root build.gradle ──
function withMinSdkInRootGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;
    const block = `
subprojects {
    plugins.withType(com.android.build.gradle.LibraryPlugin) {
        android {
            if (defaultConfig.minSdkVersion == null || defaultConfig.minSdkVersion.apiLevel < 24) {
                defaultConfig.minSdkVersion 24
            }
            defaultConfig.externalNativeBuild { cmake { arguments "-DANDROID_PLATFORM=android-24" } }
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
    gradle = gradle.replace(/\/\/ ── Jadwalin: Force minSdkVersion[\s\S]*?\n}\n/g, '');
    if (!gradle.includes('Jadwalin: Force')) {
      gradle = gradle.trimEnd() + '\n// ── Jadwalin: Force minSdkVersion 24 ──' + block;
    }
    config.modResults.contents = gradle;
    return config;
  });
}

// ── 7. Gradle fixes ──
function withGradleFixes(config) {
  return withDangerousMod(config, ['android', async (config) => {
    const androidRoot = config.modRequest.platformProjectRoot;
    const wrapperPath = path.join(androidRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties');
    if (fs.existsSync(wrapperPath)) {
      let w = fs.readFileSync(wrapperPath, 'utf8');
      w = w.replace(/distributionUrl=.*gradle-[\d.]+-.*\.zip/, 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip');
      fs.writeFileSync(wrapperPath, w, 'utf8');
    }
    const propsPath = path.join(androidRoot, 'gradle.properties');
    if (fs.existsSync(propsPath)) {
      let p = fs.readFileSync(propsPath, 'utf8');
      const fixes = { 'org.gradle.parallel': 'false', 'org.gradle.caching': 'false', 'android.minSdkVersion': '24' };
      for (const [k, v] of Object.entries(fixes)) {
        const re = new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=.*$`, 'm');
        p = re.test(p) ? p.replace(re, `${k}=${v}`) : p + `\n${k}=${v}`;
      }
      fs.writeFileSync(propsPath, p, 'utf8');
    }
    return config;
  }]);
}

// ── Main plugin ──
function withJadwalinWidget(config) {
  config = withWidgetXmlFile(config);
  config = withKotlinFiles(config);
  config = withMainApplicationPatch(config);
  config = withWidgetManifest(config);
  config = withMinSdkInAppGradle(config);
  config = withMinSdkInRootGradle(config);
  config = withGradleFixes(config);
  return config;
}

module.exports = withJadwalinWidget;

