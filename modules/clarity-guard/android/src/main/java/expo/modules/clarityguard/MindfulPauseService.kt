package expo.modules.clarityguard

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.accessibility.AccessibilityEvent

/**
 * Watches which app comes to the foreground. When it is one the user chose
 * (for example Instagram), it opens Clarity Recovery's mindful pause screen.
 * It never reads window content, text or notifications.
 */
class MindfulPauseService : AccessibilityService() {
  private var lastPackage: String? = null
  private var lastTriggerAt = 0L

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    // Keyboards and system overlays fire window events inside other apps; ignore them.
    if (pkg == "com.android.systemui" || IGNORED_HINTS.any { pkg.contains(it, ignoreCase = true) }) return
    // React only when the user switches to a different app, not on every screen change inside it.
    if (pkg == lastPackage) return
    lastPackage = pkg
    if (pkg == packageName) return

    val prefs = prefs(this)
    if (!prefs.getBoolean(KEY_ENABLED, false)) return
    val apps = prefs.getStringSet(KEY_APPS, emptySet()) ?: emptySet()
    if (pkg !in apps) return
    val now = System.currentTimeMillis()
    if (now < prefs.getLong(allowKey(pkg), 0L)) return
    if (now - lastTriggerAt < 3000) return
    lastTriggerAt = now

    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("clarity://pause?app=${Uri.encode(pkg)}")).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    try {
      startActivity(intent)
    } catch (_: Exception) {
    }
  }

  override fun onInterrupt() {}

  companion object {
    private const val PREFS = "clarity_guard"
    private val IGNORED_HINTS = listOf("inputmethod", "keyboard", "swiftkey", "honeyboard")
    const val KEY_ENABLED = "pause_enabled"
    const val KEY_APPS = "pause_apps"

    fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun allowKey(pkg: String) = "allow_until_$pkg"
  }
}
