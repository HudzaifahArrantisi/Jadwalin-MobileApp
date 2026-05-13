package com.candalena.JadwalinApp.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class JadwalinWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val PREFS_NAME = "jadwalin_widget_prefs"
        const val KEY_WIDGET_DATA = "jadwalin_widget_data"
    }

    override fun getName(): String = "JadwalinWidgetModule"

    /**
     * Called from React Native when tasks change.
     * Writes the JSON payload to SharedPreferences and
     * triggers all widget instances to refresh.
     */
    @ReactMethod
    fun updateWidgetData(jsonData: String) {
        val context = reactApplicationContext

        // Write to SharedPreferences
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_WIDGET_DATA, jsonData)
            .apply()

        // Notify all widget instances to refresh
        refreshAllWidgets(context)
    }

    /**
     * Called from React Native on logout to clear widget data.
     */
    @ReactMethod
    fun clearWidgetData() {
        val context = reactApplicationContext

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_WIDGET_DATA)
            .apply()

        refreshAllWidgets(context)
    }

    /**
     * Sends a broadcast to all JadwalinWidgetProvider instances
     * so they re-read SharedPreferences and update their views.
     */
    private fun refreshAllWidgets(context: Context) {
        val intent = Intent(context, JadwalinWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val widgetManager = AppWidgetManager.getInstance(context)
        val widgetIds = widgetManager.getAppWidgetIds(
            ComponentName(context, JadwalinWidgetProvider::class.java)
        )
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
        context.sendBroadcast(intent)
    }
}
