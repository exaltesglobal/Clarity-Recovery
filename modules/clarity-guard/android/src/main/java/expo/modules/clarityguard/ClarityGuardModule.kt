package expo.modules.clarityguard

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class ClarityGuardModule : Module() {
  private var pendingVpnPromise: Promise? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ClarityGuard")

    // ---- DNS content filter -------------------------------------------------

    Function("isDnsFilterActive") {
      DnsFilterVpnService.isActive
    }

    /** Shows the one-time system VPN consent dialog if needed, then starts the filter. */
    AsyncFunction("startDnsFilter") { promise: Promise ->
      val consent = VpnService.prepare(context)
      if (consent == null) {
        startVpnService()
        promise.resolve(true)
      } else {
        pendingVpnPromise?.resolve(false)
        pendingVpnPromise = promise
        appContext.throwingActivity.startActivityForResult(consent, VPN_REQUEST_CODE)
      }
    }

    Function("stopDnsFilter") {
      DnsFilterVpnService.setEnabledPref(context, false)
      context.startService(Intent(context, DnsFilterVpnService::class.java).setAction(DnsFilterVpnService.ACTION_STOP))
    }

    /** Opens system VPN settings, where the user can turn on "Always-on VPN" so the filter survives restarts. */
    Function("openVpnSettings") {
      appContext.throwingActivity.startActivity(Intent(Settings.ACTION_VPN_SETTINGS))
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != VPN_REQUEST_CODE) return@OnActivityResult
      val promise = pendingVpnPromise ?: return@OnActivityResult
      pendingVpnPromise = null
      if (payload.resultCode == Activity.RESULT_OK) {
        startVpnService()
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    }

    // ---- Mindful pause ------------------------------------------------------

    Function("isPauseServiceEnabled") {
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      val component = ComponentName(context, MindfulPauseService::class.java)
      enabled.split(':').any {
        ComponentName.unflattenFromString(it) == component
      }
    }

    Function("openAccessibilitySettings") {
      appContext.throwingActivity.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    /** ui: translated texts, theme colours and the user's reasons for the pause overlay. */
    Function("setPauseConfig") { enabled: Boolean, packages: List<String>, ui: Map<String, Any?> ->
      MindfulPauseService.prefs(context).edit()
        .putBoolean(MindfulPauseService.KEY_ENABLED, enabled)
        .putStringSet(MindfulPauseService.KEY_APPS, packages.toSet())
        .putString(MindfulPauseService.KEY_UI, JSONObject(ui).toString())
        .apply()
    }

    /**
     * Opens this app's system "App info" page. On Android 13+ a sideloaded APK must use
     * its menu (⋮ → Allow restricted settings) before the accessibility service can be turned on.
     */
    Function("openAppSettings") {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
      appContext.throwingActivity.startActivity(intent)
    }

    /** Lower-case device maker, e.g. "xiaomi", "oppo", "samsung". */
    Function("deviceMaker") {
      Build.MANUFACTURER.lowercase()
    }

    /**
     * Opens a phone maker's own setting that can stop the mindful pause: "autostart" or
     * "popups" (MIUI's "Display pop-up windows while running in background", under Other permissions).
     * These screens are undocumented and vary by version, so it falls back to App info.
     */
    Function("openOemSetting") { which: String ->
      val pkg = context.packageName
      val candidates = when (which) {
        "autostart" -> listOf(
          Intent().setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
          Intent().setClassName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
          Intent().setClassName("com.oplus.safecenter", "com.oplus.safecenter.permission.startup.StartupAppListActivity"),
          Intent().setClassName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
        )
        "popups" -> listOf(
          Intent("miui.intent.action.APP_PERM_EDITOR")
            .setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity")
            .putExtra("extra_pkgname", pkg),
          Intent("miui.intent.action.APP_PERM_EDITOR")
            .setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.AppPermissionsEditorActivity")
            .putExtra("extra_pkgname", pkg),
        )
        else -> emptyList()
      } + Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", pkg, null))
      val activity = appContext.throwingActivity
      candidates.any { intent ->
        try {
          activity.startActivity(intent)
          true
        } catch (_: Exception) {
          false
        }
      }
    }

    /** Lets the user into an app for a while after they chose to continue from the pause screen. */
    Function("allowApp") { pkg: String, minutes: Int ->
      MindfulPauseService.prefs(context).edit()
        .putLong(MindfulPauseService.allowKey(pkg), System.currentTimeMillis() + minutes * 60_000L)
        .apply()
    }

    Function("openApp") { pkg: String ->
      val launch = context.packageManager.getLaunchIntentForPackage(pkg) ?: return@Function false
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(launch)
      true
    }

    Function("installedApps") { packages: List<String> ->
      packages.filter { isInstalled(it) }
    }

    Function("appLabel") { pkg: String ->
      try {
        val pm = context.packageManager
        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
      } catch (_: PackageManager.NameNotFoundException) {
        null
      }
    }
  }

  private fun startVpnService() {
    context.startService(Intent(context, DnsFilterVpnService::class.java))
  }

  private fun isInstalled(pkg: String) = try {
    context.packageManager.getPackageInfo(pkg, 0)
    true
  } catch (_: PackageManager.NameNotFoundException) {
    false
  }

  companion object {
    private const val VPN_REQUEST_CODE = 0x434C
  }
}
