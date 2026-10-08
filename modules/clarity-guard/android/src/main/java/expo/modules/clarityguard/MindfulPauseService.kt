package expo.modules.clarityguard

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.PixelFormat
import android.net.Uri
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

/**
 * Watches which app comes to the foreground. When it is one the user chose
 * (for example Instagram), it draws the mindful pause on top of it as an
 * accessibility overlay. It never reads window content, text or notifications.
 *
 * The overlay is drawn by this service itself rather than by opening the app's
 * pause screen, because several Android skins (MIUI/HyperOS, ColorOS, Funtouch,
 * realme UI) block activities started from the background unless the user grants
 * an extra "pop-up windows" permission. The pause screen remains the fallback.
 */
class MindfulPauseService : AccessibilityService() {
  private var lastPackage: String? = null
  private var lastTriggerAt = 0L
  private var overlay: View? = null
  private var overlayPkg: String? = null

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    // Keyboards, system UI and system dialogs fire window events on top of other apps; ignore them.
    if (pkg == "com.android.systemui" || IGNORED_HINTS.any { pkg.contains(it, ignoreCase = true) }) return
    // Our own windows (including the overlay) don't count as switching apps.
    if (pkg == packageName) return
    // The user went home or switched to another app: take the pause down with them.
    if (overlay != null && pkg != overlayPkg) hidePause()
    // React only when the user switches to a different app, not on every screen change inside it.
    if (pkg == lastPackage) return
    lastPackage = pkg

    val prefs = prefs(this)
    if (!prefs.getBoolean(KEY_ENABLED, false)) return
    val apps = prefs.getStringSet(KEY_APPS, emptySet()) ?: emptySet()
    if (pkg !in apps) return
    val now = System.currentTimeMillis()
    if (now < prefs.getLong(allowKey(pkg), 0L)) return
    if (overlay != null || now - lastTriggerAt < 3000) return
    lastTriggerAt = now

    if (!showPause(pkg)) openInApp("clarity://pause?app=${Uri.encode(pkg)}")
  }

  private fun showPause(pkg: String): Boolean {
    val ui = try {
      JSONObject(prefs(this).getString(KEY_UI, null) ?: "{}")
    } catch (_: Exception) {
      JSONObject()
    }
    val view = PauseOverlay(
      this,
      ui,
      appLabel(pkg),
      onLeave = {
        hidePause()
        performGlobalAction(GLOBAL_ACTION_HOME)
      },
      onContinue = {
        prefs(this).edit().putLong(allowKey(pkg), System.currentTimeMillis() + ALLOW_MINUTES * 60_000L).apply()
        hidePause()
      },
      onSupport = {
        hidePause()
        performGlobalAction(GLOBAL_ACTION_HOME)
        openInApp("clarity://sos")
      },
    )
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.OPAQUE,
    )
    return try {
      windowManager().addView(view, params)
      overlay = view
      overlayPkg = pkg
      true
    } catch (e: Exception) {
      Log.w(TAG, "Could not show the pause overlay", e)
      false
    }
  }

  private fun hidePause() {
    val view = overlay ?: return
    overlay = null
    overlayPkg = null
    try {
      windowManager().removeView(view)
    } catch (e: Exception) {
      Log.w(TAG, "Could not remove the pause overlay", e)
    }
  }

  private fun openInApp(uri: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    try {
      startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open $uri", e)
    }
  }

  private fun appLabel(pkg: String) =
    try {
      packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
    } catch (_: PackageManager.NameNotFoundException) {
      pkg
    }

  private fun windowManager() = getSystemService(Context.WINDOW_SERVICE) as WindowManager

  override fun onInterrupt() {}

  override fun onDestroy() {
    hidePause()
    super.onDestroy()
  }

  companion object {
    private const val TAG = "ClarityPause"
    private const val PREFS = "clarity_guard"
    private const val ALLOW_MINUTES = 10
    private val IGNORED_HINTS = listOf(
      "inputmethod", "keyboard", "swiftkey", "honeyboard",
      // Permission prompts and Google sign-in sheets can appear over an app without the user leaving it.
      "permissioncontroller", "packageinstaller", "com.google.android.gms",
    )
    const val KEY_ENABLED = "pause_enabled"
    const val KEY_APPS = "pause_apps"
    const val KEY_UI = "pause_ui"

    fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun allowKey(pkg: String) = "allow_until_$pkg"
  }
}
