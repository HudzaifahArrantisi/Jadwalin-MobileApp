// ============================================
// Jadwalin Widget — AppWidgetProvider (Kotlin)
// The actual widget that appears on homescreen.
// Reads tasks from SharedPreferences and renders them.
// ============================================

package com.candalena.JadwalinApp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.candalena.JadwalinApp.R
import org.json.JSONObject

class JadwalinWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.jadwalin_widget)

        // Read data from SharedPreferences
        val prefs = context.getSharedPreferences(
            JadwalinWidgetModule.PREFS_NAME,
            Context.MODE_PRIVATE
        )
        val jsonStr = prefs.getString(JadwalinWidgetModule.KEY_WIDGET_DATA, null)

        if (jsonStr != null) {
            try {
                val data = JSONObject(jsonStr)
                val dateLabel = data.optString("dateLabel", "Hari ini")
                val totalTasks = data.optInt("totalTasks", 0)
                val completedTasks = data.optInt("completedTasks", 0)
                val tasks = data.optJSONArray("tasks")

                // Set header
                views.setTextViewText(R.id.widget_date, dateLabel)
                views.setTextViewText(
                    R.id.widget_summary,
                    "$completedTasks/$totalTasks tugas selesai"
                )

                // Populate task rows (up to 3 visible slots)
                val taskRowIds = intArrayOf(
                    R.id.widget_task_row_1,
                    R.id.widget_task_row_2,
                    R.id.widget_task_row_3
                )
                val taskTitleIds = intArrayOf(
                    R.id.widget_task_title_1,
                    R.id.widget_task_title_2,
                    R.id.widget_task_title_3
                )
                val taskTimeIds = intArrayOf(
                    R.id.widget_task_time_1,
                    R.id.widget_task_time_2,
                    R.id.widget_task_time_3
                )
                val taskDotIds = intArrayOf(
                    R.id.widget_task_dot_1,
                    R.id.widget_task_dot_2,
                    R.id.widget_task_dot_3
                )

                for (i in taskRowIds.indices) {
                    if (tasks != null && i < tasks.length()) {
                        val task = tasks.getJSONObject(i)
                        views.setViewVisibility(taskRowIds[i], View.VISIBLE)
                        views.setTextViewText(taskTitleIds[i], task.optString("title", ""))
                        views.setTextViewText(taskTimeIds[i], task.optString("time", ""))

                        // Set dot color based on category
                        val category = task.optString("category", "task")
                        val dotColor = when (category) {
                            "schedule" -> 0xFF7C3AED.toInt() // Purple
                            "task" -> 0xFF3B82F6.toInt()     // Blue
                            "reminder" -> 0xFFF59E0B.toInt() // Amber
                            else -> 0xFF5C4A32.toInt()       // Brown
                        }
                        views.setInt(taskDotIds[i], "setColorFilter", dotColor)
                    } else {
                        views.setViewVisibility(taskRowIds[i], View.GONE)
                    }
                }

                // Show empty state if no tasks
                if (tasks == null || tasks.length() == 0) {
                    views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.widget_empty, View.GONE)
                }

            } catch (e: Exception) {
                views.setTextViewText(R.id.widget_date, "Jadwalin")
                views.setTextViewText(R.id.widget_summary, "Buka aplikasi untuk mulai")
            }
        } else {
            // No data yet
            views.setTextViewText(R.id.widget_date, "Jadwalin")
            views.setTextViewText(R.id.widget_summary, "Buka aplikasi untuk memuat jadwal")
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
            views.setViewVisibility(R.id.widget_task_row_1, View.GONE)
            views.setViewVisibility(R.id.widget_task_row_2, View.GONE)
            views.setViewVisibility(R.id.widget_task_row_3, View.GONE)
        }

        // Tap widget → open app
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
