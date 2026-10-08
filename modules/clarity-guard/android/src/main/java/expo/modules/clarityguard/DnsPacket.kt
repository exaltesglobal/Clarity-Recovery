package expo.modules.clarityguard

/** Minimal IPv4/UDP handling for DNS packets read from and written to the VPN interface. */
object DnsPacket {
  class Query(
    val sourceIp: ByteArray,
    val destIp: ByteArray,
    val sourcePort: Int,
    val destPort: Int,
    val payload: ByteArray,
  )

  /** Returns the DNS query inside an IPv4 UDP packet to port 53, or null for anything else. */
  fun parseQuery(packet: ByteArray): Query? {
    if (packet.size < 28) return null
    val version = (packet[0].toInt() shr 4) and 0x0F
    if (version != 4) return null
    val headerLength = (packet[0].toInt() and 0x0F) * 4
    if (packet[9].toInt() != 17) return null // not UDP
    if (packet.size < headerLength + 8) return null
    val sourcePort = u16(packet, headerLength)
    val destPort = u16(packet, headerLength + 2)
    if (destPort != 53) return null
    val udpLength = u16(packet, headerLength + 4)
    val payloadEnd = minOf(packet.size, headerLength + udpLength)
    val payloadStart = headerLength + 8
    if (payloadEnd <= payloadStart) return null
    return Query(
      sourceIp = packet.copyOfRange(12, 16),
      destIp = packet.copyOfRange(16, 20),
      sourcePort = sourcePort,
      destPort = destPort,
      payload = packet.copyOfRange(payloadStart, payloadEnd),
    )
  }

  /** Wraps a DNS answer in an IPv4/UDP packet addressed back to the app that asked. */
  fun buildResponse(query: Query, dns: ByteArray): ByteArray {
    val totalLength = 20 + 8 + dns.size
    val out = ByteArray(totalLength)
    out[0] = 0x45 // IPv4, 20-byte header
    putU16(out, 2, totalLength)
    out[6] = 0x40 // don't fragment
    out[8] = 64 // TTL
    out[9] = 17 // UDP
    System.arraycopy(query.destIp, 0, out, 12, 4) // answer comes from the resolver the app asked
    System.arraycopy(query.sourceIp, 0, out, 16, 4)
    putU16(out, 10, checksum(out, 0, 20))

    putU16(out, 20, query.destPort)
    putU16(out, 22, query.sourcePort)
    putU16(out, 24, 8 + dns.size)
    // UDP checksum 0 = not computed, which is valid for IPv4.
    System.arraycopy(dns, 0, out, 28, dns.size)
    return out
  }

  private fun u16(b: ByteArray, offset: Int) = ((b[offset].toInt() and 0xFF) shl 8) or (b[offset + 1].toInt() and 0xFF)

  private fun putU16(b: ByteArray, offset: Int, value: Int) {
    b[offset] = ((value shr 8) and 0xFF).toByte()
    b[offset + 1] = (value and 0xFF).toByte()
  }

  private fun checksum(b: ByteArray, offset: Int, length: Int): Int {
    var sum = 0L
    var i = offset
    while (i < offset + length - 1) {
      sum += u16(b, i)
      i += 2
    }
    if (length % 2 == 1) sum += (b[offset + length - 1].toInt() and 0xFF) shl 8
    while (sum shr 16 != 0L) sum = (sum and 0xFFFF) + (sum shr 16)
    return sum.inv().toInt() and 0xFFFF
  }
}
