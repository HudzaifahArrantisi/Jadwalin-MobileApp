package com.candalena.JadwalinApp.widget

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject
import com.candalena.JadwalinApp.R

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
}