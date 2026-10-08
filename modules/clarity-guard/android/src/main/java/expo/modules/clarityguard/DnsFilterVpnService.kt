package expo.modules.clarityguard

import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * A DNS-only local VPN. It routes nothing except DNS lookups sent to a virtual
 * resolver address; those are forwarded to CleanBrowsing's Family Filter, which
 * refuses to resolve adult domains. All other traffic goes straight to the
 * network, so browsing speed and battery are unaffected.
 */
class DnsFilterVpnService : VpnService() {
  private var tun: ParcelFileDescriptor? = null
  private var worker: Thread? = null
  private var pool: ExecutorService? = null
  private val running = AtomicBoolean(false)

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopFilter()
      stopSelf()
      return START_NOT_STICKY
    }
    startFilter()
    return START_STICKY
  }

  override fun onRevoke() {
    // Another VPN was started or the user turned us off in system settings.
    stopFilter()
    setEnabledPref(this, false)
    super.onRevoke()
  }

  override fun onDestroy() {
    stopFilter()
    super.onDestroy()
  }

  private fun startFilter() {
    if (running.get()) return
    val iface = try {
      Builder()
        .setSession("Clarity Recovery DNS filter")
        .addAddress(TUN_ADDRESS, 32)
        .addDnsServer(VIRTUAL_DNS)
        .addRoute(VIRTUAL_DNS, 32)
        .setBlocking(true)
        .establish()
    } catch (e: Exception) {
      Log.e(TAG, "Could not establish VPN", e)
      null
    } ?: run {
      stopSelf()
      return
    }

    tun = iface
    running.set(true)
    isActive = true
    setEnabledPref(this, true)
    pool = Executors.newFixedThreadPool(4)
    worker = Thread({ loop(iface) }, "clarity-dns").also { it.start() }
  }

  private fun stopFilter() {
    running.set(false)
    isActive = false
    try {
      tun?.close()
    } catch (_: IOException) {
    }
    tun = null
    worker?.interrupt()
    worker = null
    pool?.shutdownNow()
    pool = null
  }

  private fun loop(iface: ParcelFileDescriptor) {
    val input = FileInputStream(iface.fileDescriptor)
    val output = FileOutputStream(iface.fileDescriptor)
    val buffer = ByteArray(32767)
    while (running.get()) {
      val length = try {
        input.read(buffer)
      } catch (e: IOException) {
        if (running.get()) Log.w(TAG, "tun read failed", e)
        break
      }
      if (length <= 0) continue
      val packet = buffer.copyOf(length)
      val query = DnsPacket.parseQuery(packet) ?: continue
      pool?.execute { answer(query, output) }
    }
  }

  private fun answer(query: DnsPacket.Query, output: FileOutputStream) {
    for (upstream in UPSTREAM_DNS) {
      try {
        DatagramSocket().use { socket ->
          // Keep the forwarded lookup outside the VPN so it does not loop back into us.
          protect(socket)
          socket.soTimeout = 4000
          val address = InetAddress.getByName(upstream)
          socket.send(DatagramPacket(query.payload, query.payload.size, address, 53))
          val response = ByteArray(4096)
          val reply = DatagramPacket(response, response.size)
          socket.receive(reply)
          val packet = DnsPacket.buildResponse(query, response.copyOf(reply.length))
          synchronized(output) { output.write(packet) }
        }
        return
      } catch (e: Exception) {
        Log.w(TAG, "DNS forward to $upstream failed", e)
      }
    }
  }

  companion object {
    private const val TAG = "ClarityDnsFilter"
    const val ACTION_STOP = "expo.modules.clarityguard.STOP_DNS_FILTER"
    private const val TUN_ADDRESS = "10.111.222.2"
    private const val VIRTUAL_DNS = "10.111.222.1"

    /** CleanBrowsing Family Filter: blocks adult, proxy/VPN and mixed-content sites, and enforces SafeSearch. */
    val UPSTREAM_DNS = listOf("185.228.168.168", "185.228.169.168")

    private const val PREFS = "clarity_guard"
    private const val KEY_ENABLED = "dns_enabled"

    @Volatile
    var isActive = false
      private set

    fun setEnabledPref(context: Context, enabled: Boolean) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
  }
}
