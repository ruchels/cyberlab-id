import crypto from "node:crypto";

export interface LogAnalysisFinding {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  sourceIp?: string;
  occurrences: number;
  sampleLine: string;
  mitigation: string;
}

export interface LogAnalysisResult {
  totalLinesParsed: number;
  suspiciousLinesCount: number;
  uniqueIpsCount: number;
  findings: LogAnalysisFinding[];
  summary: string;
  recommendedActions: string[];
  confidence: "low" | "medium" | "high";
  limitations: string;
}

export interface NetworkTrafficFinding {
  protocol: string;
  anomalyType: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  destination: string;
  details: string;
  snortRuleRecommendation?: string;
}

export interface NetworkAnalysisResult {
  totalPackets: number;
  protocolsDetected: Record<string, number>;
  topTalkers: { ip: string; count: number }[];
  portDistribution: Record<string, number>;
  findings: NetworkTrafficFinding[];
  summary: string;
  recommendedActions: string[];
  confidence: "low" | "medium" | "high";
  limitations: string;
}

export interface FileAnalysisResult {
  filename: string;
  fileSizeBytes: number;
  sha256: string;
  sha1: string;
  md5: string;
  declaredExtension: string;
  detectedMimeType: string;
  detectedSignature: string;
  isExtensionSpoofed: boolean;
  entropyScore: number; // 0 to 8
  characteristics: string[];
  findings: { severity: "low" | "medium" | "high"; description: string }[];
  summary: string;
  recommendedActions: string[];
  confidence: "low" | "medium" | "high";
  limitations: string;
}

// -----------------------------------------------------------------------------
// 1. Log Analyzer
// -----------------------------------------------------------------------------
export function analyzeLogs(logText: string): LogAnalysisResult {
  const lines = logText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const totalLines = lines.length;

  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
  const ips = new Set<string>();

  const ipFailureCounts: Record<string, number> = {};
  const sqliMatches: { line: string; ip: string }[] = [];
  const traversalMatches: { line: string; ip: string }[] = [];
  const scannerMatches: { line: string; ip: string }[] = [];

  const findings: LogAnalysisFinding[] = [];

  for (const line of lines) {
    const ipMatch = line.match(ipRegex);
    const ip = ipMatch ? ipMatch[0] : "unknown";
    if (ip !== "unknown") ips.add(ip);

    const lower = line.toLowerCase();

    // Check failed authentication
    if (
      lower.includes("failed password") ||
      lower.includes("authentication failure") ||
      lower.includes(" 401 ") ||
      lower.includes("invalid user")
    ) {
      ipFailureCounts[ip] = (ipFailureCounts[ip] || 0) + 1;
    }

    // Check SQL Injection patterns
    if (
      lower.includes("union select") ||
      lower.includes("' or 1=1") ||
      lower.includes("information_schema") ||
      lower.includes("sleep(") ||
      lower.includes("-- -")
    ) {
      sqliMatches.push({ line, ip });
    }

    // Check Directory Traversal
    if (lower.includes("../..") || lower.includes("etc/passwd") || lower.includes("windows/win.ini")) {
      traversalMatches.push({ line, ip });
    }

    // Check Automated Scanners
    if (
      lower.includes("sqlmap") ||
      lower.includes("nikto") ||
      lower.includes("gobuster") ||
      lower.includes("nmap") ||
      lower.includes("wpscan")
    ) {
      scannerMatches.push({ line, ip });
    }
  }

  // Evaluate Brute Force findings
  for (const [ip, count] of Object.entries(ipFailureCounts)) {
    if (count >= 3) {
      findings.push({
        type: "Brute Force / Password Guessing Attack",
        severity: count >= 10 ? "critical" : "high",
        description: `Terdeteksi ${count} kali kegagalan autentikasi beruntun dari IP ${ip}.`,
        sourceIp: ip,
        occurrences: count,
        sampleLine: lines.find((l) => l.includes(ip) && (l.includes("failed") || l.includes("401"))) || "",
        mitigation: `Terapkan jail Fail2ban untuk memblokir IP ${ip} selama 24 jam dan terapkan autentikasi SSH berbasis kunci privat atau MFA.`,
      });
    }
  }

  // Evaluate SQL Injection findings
  if (sqliMatches.length > 0) {
    findings.push({
      type: "Web SQL Injection Exploitation Attempt",
      severity: "critical",
      description: `Terdeteksi ${sqliMatches.length} payload query manipulasi SQL (UNION SELECT / sleep / quote bypass).`,
      sourceIp: sqliMatches[0].ip,
      occurrences: sqliMatches.length,
      sampleLine: sqliMatches[0].line.slice(0, 160),
      mitigation: "Terapkan Parameterized Queries (Prepared Statements) dan aktifkan modul Web Application Firewall (WAF) seperti ModSecurity atau Cloudflare WAF.",
    });
  }

  // Evaluate Traversal findings
  if (traversalMatches.length > 0) {
    findings.push({
      type: "Path Traversal / Local File Inclusion (LFI)",
      severity: "high",
      description: `Terdeteksi upaya membaca file sistem sensitif (${traversalMatches.length} permintaan mengandung '../' atau 'etc/passwd').`,
      sourceIp: traversalMatches[0].ip,
      occurrences: traversalMatches.length,
      sampleLine: traversalMatches[0].line.slice(0, 160),
      mitigation: "Validasi jalur berkas di server dengan path.normalize(), hapus karakter relatif '../', dan batasi akses ke root folder aplikasi.",
    });
  }

  // Evaluate Scanner findings
  if (scannerMatches.length > 0) {
    findings.push({
      type: "Automated Vulnerability Scanner Activity",
      severity: "medium",
      description: `Terdeteksi aktivitas scanner keamanan otomatis (User-Agent: ${scannerMatches[0].line.match(/(sqlmap|nikto|gobuster|nmap)/i)?.[0] || "Scanner"}).`,
      sourceIp: scannerMatches[0].ip,
      occurrences: scannerMatches.length,
      sampleLine: scannerMatches[0].line.slice(0, 160),
      mitigation: "Blokir pola User-Agent pemindai di konfigurasi Nginx/Apache dan terapkan rate-limiting pada endpoint API.",
    });
  }

  const suspiciousLinesCount =
    Object.values(ipFailureCounts).reduce((a, b) => a + b, 0) +
    sqliMatches.length +
    traversalMatches.length +
    scannerMatches.length;

  const confidence: "low" | "medium" | "high" =
    totalLines > 20 && findings.length > 0 ? "high" : findings.length > 0 ? "medium" : "low";

  const recommendedActions = [
    "Periksa status port firewall dan blokir IP penyerang aktif menggunakan iptables atau ufw.",
    "Terapkan aturan pembatasan laju koneksi (Rate Limiting) pada server web untuk mencegah otomasi request berlebihan.",
    "Audit kode sumber aplikasi pada endpoint yang ditargetkan untuk memastikan tidak ada query konkatenasi mentah.",
    "Aktifkan notifikasi real-time pada SIEM atau alert daemon ketika terdapat lebih dari 5 kali kegagalan login dalam 1 menit.",
  ];

  const summary =
    findings.length > 0
      ? `Analisis menemukan ${findings.length} kategori indikator anomali keamanan siber dari ${totalLines} baris log yang dipindai. Ditemukan aktivitas mencurigakan yang mengarah pada serangan berbasis web dan upaya tebak kredensial.`
      : `Tidak ditemukan pola serangan umum yang mencurigakan dari ${totalLines} baris log yang dianalisis. Log berada dalam batas operasional wajar.`;

  return {
    totalLinesParsed: totalLines,
    suspiciousLinesCount,
    uniqueIpsCount: ips.size,
    findings,
    summary,
    recommendedActions,
    confidence,
    limitations: "Analisis log berbasis heuristik pola teks. Log yang dienkripsi, terpotong, atau menggunakan payload zero-day baru mungkin memerlukan korelasi SIEM mendalam.",
  };
}

// -----------------------------------------------------------------------------
// 2. Network Traffic Analyzer
// -----------------------------------------------------------------------------
export function analyzeNetworkTraffic(packetData: string | any[]): NetworkAnalysisResult {
  let packets: any[] = [];

  if (typeof packetData === "string") {
    // If text, try to parse JSON array or line-based mock packet summaries
    try {
      packets = JSON.parse(packetData);
    } catch {
      const lines = packetData.split(/\r?\n/).filter((l) => l.trim().length > 0);
      packets = lines.map((l, idx) => {
        const ipMatches = l.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || ["192.168.1.10", "192.168.1.1"];
        const proto = l.toUpperCase().includes("UDP") ? "UDP" : l.toUpperCase().includes("DNS") ? "DNS" : "TCP";
        const lastPortMatch = [...l.matchAll(/(?:->|:)\s*(\d{1,5})\b(?!\.)/g)].pop();
        const portWordMatch = l.match(/(?:port|dst)\s*[:=]?\s*(\d{1,5})\b/i);
        const port = lastPortMatch ? parseInt(lastPortMatch[1]) : portWordMatch ? parseInt(portWordMatch[1]) : 80;
        return {
          id: idx + 1,
          src: ipMatches[0] || "192.168.1.100",
          dst: ipMatches[1] || "10.0.0.1",
          protocol: proto,
          port,
          flags: l.includes("SYN") ? "SYN" : l.includes("ACK") ? "ACK" : "",
          raw: l,
        };
      });
    }
  } else if (Array.isArray(packetData)) {
    packets = packetData;
  }

  const protocolsDetected: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};
  const portDistribution: Record<string, number> = {};
  const findings: NetworkTrafficFinding[] = [];

  let synCount = 0;
  let ackCount = 0;
  const ipTargetPorts: Record<string, Set<number>> = {};

  for (const pkt of packets) {
    const proto = pkt.protocol || "TCP";
    protocolsDetected[proto] = (protocolsDetected[proto] || 0) + 1;

    const src = pkt.src || "unknown";
    const dst = pkt.dst || "unknown";
    const port = pkt.port ? String(pkt.port) : "80";

    ipCounts[src] = (ipCounts[src] || 0) + 1;
    portDistribution[port] = (portDistribution[port] || 0) + 1;

    if (pkt.flags && pkt.flags.includes("SYN") && !pkt.flags.includes("ACK")) {
      synCount++;
      if (!ipTargetPorts[src]) ipTargetPorts[src] = new Set();
      if (pkt.port) ipTargetPorts[src].add(Number(pkt.port));
    }
    if (pkt.flags && pkt.flags.includes("ACK")) {
      ackCount++;
    }

    // Check plaintext credentials in packet data if raw text present
    if (pkt.raw && (pkt.raw.includes("Authorization: Basic") || pkt.raw.includes("USER ") || pkt.raw.includes("PASS "))) {
      findings.push({
        protocol: proto,
        anomalyType: "Plaintext Credential Transmission",
        severity: "critical",
        source: src,
        destination: dst,
        details: "Ditemukan transmisi kredensial autentikasi tanpa enkripsi TLS (HTTP Basic Auth / FTP).",
        snortRuleRecommendation: `alert tcp ${src} any -> ${dst} ${port} (msg:"PLAINTEXT CREDENTIALS DETECTED"; content:"Basic"; sid:1000001; rev:1;)`,
      });
    }
  }

  // Detect Port Scanning
  for (const [ip, ports] of Object.entries(ipTargetPorts)) {
    if (ports.size >= 5) {
      findings.push({
        protocol: "TCP",
        anomalyType: "Horizontal / Vertical Port Scan",
        severity: "high",
        source: ip,
        destination: "Multiple",
        details: `IP ${ip} mengirimkan paket SYN ke ${ports.size} nomor port berbeda secara berurutan.`,
        snortRuleRecommendation: `alert tcp ${ip} any -> any any (msg:"SYN PORT SCAN DETECTED"; flags:S; threshold:type both, track by_src, count 10, seconds 5; sid:1000002; rev:1;)`,
      });
    }
  }

  // Detect SYN Flood anomaly
  if (synCount > 20 && ackCount < synCount * 0.2) {
    findings.push({
      protocol: "TCP",
      anomalyType: "Potential TCP SYN Flood DoS",
      severity: "critical",
      source: "Distributed / Spoofed",
      destination: "Target Gateway",
      details: `Rasio SYN berbanding ACK sangat timpang (${synCount} SYN vs ${ackCount} ACK), mengindikasikan serangan kehabisan tabel status koneksi.`,
      snortRuleRecommendation: 'alert tcp any any -> $HOME_NET any (msg:"TCP SYN FLOOD"; flags:S; threshold:type threshold, track by_dst, count 50, seconds 1; sid:1000003; rev:1;)',
    });
  }

  const topTalkers = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  const summary =
    findings.length > 0
      ? `Analisis menangkap ${packets.length} paket data dan mengidentifikasi ${findings.length} indikator anomali jaringan. Ditemukan komunikasi tidak aman dan/atau aktivitas pemindaian port aktif.`
      : `Analisis menangkap ${packets.length} paket data. Tidak terdeteksi anomali transmisi kritis; distribusi protokol berjalan normal.`;

  return {
    totalPackets: packets.length,
    protocolsDetected,
    topTalkers,
    portDistribution,
    findings,
    summary,
    recommendedActions: [
      "Wajibkan penegakan protokol terenkripsi (HTTPS / SSH / SFTP) dan matikan layanan HTTP/FTP tanpa TLS.",
      "Terapkan aturan firewall stateful untuk membatasi laju paket TCP SYN per detik (SYN flood mitigation).",
      "Gunakan IDS/IPS (Suricata/Snort) dengan signature terlampir untuk deteksi otomatis pemindaian port.",
    ],
    confidence: packets.length > 10 ? "high" : "medium",
    limitations: "Analisis berbasis metadata paket dan header. Konten paket yang telah terenkripsi end-to-end (TLS 1.3) tidak dapat diinspeksi muatan payload-nya tanpa proxy dekripsi resmi.",
  };
}

// -----------------------------------------------------------------------------
// 3. File Analysis Assistant
// -----------------------------------------------------------------------------
export function analyzeFileMetadata(filename: string, fileBytes: Uint8Array | Buffer): FileAnalysisResult {
  const fileBuffer = Buffer.from(fileBytes);
  const fileSizeBytes = fileBuffer.length;

  // Hashes
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const sha1 = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  const md5 = crypto.createHash("md5").update(fileBuffer).digest("hex");

  // Extension
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const declaredExtension = extMatch ? extMatch[1].toLowerCase() : "unknown";

  // Magic Bytes signature inspection
  const hexHeader = fileBuffer.subarray(0, 8).toString("hex").toUpperCase();

  let detectedSignature = "Unknown Binary or Text Data";
  let detectedMimeType = "application/octet-stream";
  let expectedExt = "bin";

  if (hexHeader.startsWith("89504E47")) {
    detectedSignature = "PNG Image (Portable Network Graphics)";
    detectedMimeType = "image/png";
    expectedExt = "png";
  } else if (hexHeader.startsWith("FFD8FF")) {
    detectedSignature = "JPEG Image";
    detectedMimeType = "image/jpeg";
    expectedExt = "jpg";
  } else if (hexHeader.startsWith("4D5A")) {
    detectedSignature = "Windows Portable Executable (PE32 / EXE / DLL)";
    detectedMimeType = "application/x-dosexec";
    expectedExt = "exe";
  } else if (hexHeader.startsWith("7F454C46")) {
    detectedSignature = "Linux Executable and Linkable Format (ELF)";
    detectedMimeType = "application/x-executable";
    expectedExt = "elf";
  } else if (hexHeader.startsWith("25504446")) {
    detectedSignature = "Adobe Portable Document Format (PDF)";
    detectedMimeType = "application/pdf";
    expectedExt = "pdf";
  } else if (hexHeader.startsWith("504B0304")) {
    detectedSignature = "ZIP Archive / OpenDocument / APK";
    detectedMimeType = "application/zip";
    expectedExt = "zip";
  }

  // Calculate Shannon Entropy (0 to 8 bits)
  const byteCounts = new Array(256).fill(0);
  for (let i = 0; i < fileBuffer.length; i++) {
    byteCounts[fileBuffer[i]]++;
  }
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (byteCounts[i] > 0) {
      const p = byteCounts[i] / fileBuffer.length;
      entropy -= p * Math.log2(p);
    }
  }
  const entropyScore = Math.round(entropy * 100) / 100;

  // Extension spoofing check
  const isExtensionSpoofed =
    expectedExt !== "bin" &&
    declaredExtension !== expectedExt &&
    !(expectedExt === "jpg" && declaredExtension === "jpeg") &&
    !(expectedExt === "zip" && ["docx", "xlsx", "pptx", "apk", "jar"].includes(declaredExtension));

  const findings: { severity: "low" | "medium" | "high"; description: string }[] = [];
  const characteristics: string[] = [
    `Magic Bytes Header: ${hexHeader}`,
    `Ukuran Berkas: ${(fileSizeBytes / 1024).toFixed(2)} KB (${fileSizeBytes} bytes)`,
    `Shannon Entropy: ${entropyScore} / 8.0`,
  ];

  if (isExtensionSpoofed) {
    findings.push({
      severity: "high",
      description: `PENYAMARAN EKSTENSI TERDETEKSI: Nama berkas berakhiran '.${declaredExtension}', namun struktur Magic Bytes membuktikan berkas ini adalah '${detectedSignature}'. Ini adalah indikator umum rekayasa sosial pengiriman malware.`,
    });
  }

  if (entropyScore > 7.2) {
    findings.push({
      severity: "medium",
      description: `Nilai entropi sangat tinggi (${entropyScore}/8.0), menandakan data terkompresi rapat atau kemungkinan mengandung payload terenkripsi/terobfuskasi.`,
    });
  }

  if (detectedSignature.includes("Executable")) {
    findings.push({
      severity: "high",
      description: "Berkas merupakan biner executable yang dapat mengeksekusi instruksi mesin langsung pada sistem operasi target.",
    });
  }

  const summary = isExtensionSpoofed
    ? `PERINGATAN BAHAYA: Berkas "${filename}" memanipulasi ekstensi visual untuk menyembunyikan payload bertipe ${detectedSignature}. Jangan pernah membuka berkas ini di luar sandbox terisolasi.`
    : `Analisis berkas selesai. Berkas "${filename}" terkonfirmasi berformat ${detectedSignature} dengan integritas checksum valid.`;

  return {
    filename,
    fileSizeBytes,
    sha256,
    sha1,
    md5,
    declaredExtension,
    detectedMimeType,
    detectedSignature,
    isExtensionSpoofed,
    entropyScore,
    characteristics,
    findings,
    summary,
    recommendedActions: [
      "Karantina berkas dan jangan jalankan (execute) pada sistem operasi host utama.",
      "Periksa hash SHA-256 berkas di basis data intelijen ancaman siber (seperti VirusTotal atau MalwareBazaar).",
      "Jika diperlukan analisis dinamis lebih lanjut, gunakan VM terisolasi tanpa koneksi jaringan lokal.",
    ],
    confidence: "high",
    limitations: "Analisis dilakukan secara statis non-eksekusi (zero-execution safe analysis). Analisis perilaku dinamis runtime membutuhkan virtual sandbox khusus.",
  };
}
