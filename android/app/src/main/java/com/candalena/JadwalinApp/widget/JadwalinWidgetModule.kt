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
}