package com.candalena.JadwalinApp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import com.candalena.JadwalinApp.R

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
}