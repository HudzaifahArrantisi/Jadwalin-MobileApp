// ============================================
// Jadwalin Widget — Package Registration (Kotlin)
// Registers the NativeModule so React Native
// can call JadwalinWidgetModule from JavaScript.
// ============================================

package com.candalena.JadwalinApp.widget

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
}
