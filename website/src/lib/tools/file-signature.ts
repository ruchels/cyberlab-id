/**
 * File Signature Checker - Core Logic
 * Inspects Magic Bytes (file headers) to reveal actual file formats
 * and detects dangerous file extension spoofing.
 */

export interface SignatureEntry {
  extension: string;
  mimeType: string;
  name: string;
  description: string;
  magicBytes: number[];
  offset?: number;
}

export const SIGNATURE_DATABASE: SignatureEntry[] = [
  {
    extension: "png",
    mimeType: "image/png",
    name: "PNG Image",
    description: "Portable Network Graphics image",
    magicBytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    name: "JPEG Image",
    description: "Joint Photographic Experts Group format",
    magicBytes: [0xff, 0xd8, 0xff],
  },
  {
    extension: "gif",
    mimeType: "image/gif",
    name: "GIF87a Image",
    description: "Graphics Interchange Format 87a",
    magicBytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  },
  {
    extension: "gif",
    mimeType: "image/gif",
    name: "GIF89a Image",
    description: "Graphics Interchange Format 89a",
    magicBytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  },
  {
    extension: "pdf",
    mimeType: "application/pdf",
    name: "PDF Document",
    description: "Adobe Portable Document Format",
    magicBytes: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
  {
    extension: "zip",
    mimeType: "application/zip",
    name: "ZIP Archive / OpenDocument",
    description: "Standard ZIP archive (also used by DOCX, XLSX, APK, JAR)",
    magicBytes: [0x50, 0x4b, 0x03, 0x04], // PK..
  },
  {
    extension: "rar",
    mimeType: "application/x-rar-compressed",
    name: "RAR Archive",
    description: "Roshal Archive 5.0+ compressed file",
    magicBytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07],
  },
  {
    extension: "7z",
    mimeType: "application/x-7z-compressed",
    name: "7-Zip Archive",
    description: "7-Zip high ratio compressed archive",
    magicBytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],
  },
  {
    extension: "elf",
    mimeType: "application/x-executable",
    name: "ELF Binary",
    description: "Linux Executable and Linkable Format binary",
    magicBytes: [0x7f, 0x45, 0x4c, 0x46], // .ELF
  },
  {
    extension: "exe",
    mimeType: "application/x-dosexec",
    name: "Windows PE / EXE",
    description: "Microsoft Windows Portable Executable (MZ header)",
    magicBytes: [0x4d, 0x5a], // MZ
  },
  {
    extension: "class",
    mimeType: "application/java-vm",
    name: "Java Bytecode",
    description: "Compiled Java class file (CAFEBABE)",
    magicBytes: [0xca, 0xfe, 0xba, 0xbe],
  },
  {
    extension: "sqlite",
    mimeType: "application/vnd.sqlite3",
    name: "SQLite 3 Database",
    description: "SQLite Database file format 3",
    magicBytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00],
  },
  {
    extension: "mp3",
    mimeType: "audio/mpeg",
    name: "MP3 Audio (ID3v2)",
    description: "MPEG Audio Layer III with ID3v2 tag",
    magicBytes: [0x49, 0x44, 0x33], // ID3
  },
  {
    extension: "gz",
    mimeType: "application/gzip",
    name: "GZIP Compressed File",
    description: "GNU zip compressed stream",
    magicBytes: [0x1f, 0x8b],
  },
  {
    extension: "bmp",
    mimeType: "image/bmp",
    name: "BMP Bitmap Image",
    description: "Windows Bitmap image (BM header)",
    magicBytes: [0x42, 0x4d], // BM
  },
  {
    extension: "wav",
    mimeType: "audio/wav",
    name: "WAV Audio",
    description: "Waveform Audio File Format (RIFF container)",
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    name: "WebP Image",
    description: "Google WebP image format",
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF
  },
  {
    extension: "wasm",
    mimeType: "application/wasm",
    name: "WebAssembly Binary",
    description: "WebAssembly binary module (\\0asm)",
    magicBytes: [0x00, 0x61, 0x73, 0x6d],
  },
  {
    extension: "pcap",
    mimeType: "application/vnd.tcpdump.pcap",
    name: "Wireshark PCAP",
    description: "Network packet capture file",
    magicBytes: [0xd4, 0xc3, 0xb2, 0xa1],
  },
];

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  declaredExtension: string;
  detectedSignatures: SignatureEntry[];
  isExtensionMismatch: boolean;
  hexPreview: string;
  asciiPreview: string;
  severity: "safe" | "warning" | "danger" | "unknown";
}

export function analyzeFileSignature(fileName: string, buffer: ArrayBuffer): FileAnalysisResult {
  const bytes = new Uint8Array(buffer.slice(0, 32));
  const fileSize = buffer.byteLength;

  // Extract declared extension
  const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const declaredExtension = extMatch ? extMatch[1] : "";

  // Hex and ASCII dump
  const hexParts: string[] = [];
  let asciiParts = "";
  for (let i = 0; i < Math.min(16, bytes.length); i++) {
    const b = bytes[i];
    hexParts.push(b.toString(16).padStart(2, "0").toUpperCase());
    asciiParts += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
  }
  const hexPreview = hexParts.join(" ");
  const asciiPreview = asciiParts;

  // Search signatures
  const detectedSignatures: SignatureEntry[] = [];
  for (const sig of SIGNATURE_DATABASE) {
    const offset = sig.offset || 0;
    if (bytes.length < offset + sig.magicBytes.length) continue;

    let match = true;
    for (let i = 0; i < sig.magicBytes.length; i++) {
      if (bytes[offset + i] !== sig.magicBytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      detectedSignatures.push(sig);
    }
  }

  // Check extension spoofing
  let isExtensionMismatch = false;
  let severity: "safe" | "warning" | "danger" | "unknown" = "unknown";

  if (detectedSignatures.length > 0) {
    const matchesAnyExt = detectedSignatures.some(
      (s) =>
        s.extension === declaredExtension ||
        (s.extension === "zip" && ["docx", "xlsx", "pptx", "apk", "jar"].includes(declaredExtension)) ||
        (s.extension === "jpg" && declaredExtension === "jpeg")
    );

    if (!matchesAnyExt && declaredExtension) {
      isExtensionMismatch = true;
      // High danger if executable (PE/ELF) disguised as image/doc
      const isExecutable = detectedSignatures.some((s) => ["exe", "elf", "class"].includes(s.extension));
      severity = isExecutable ? "danger" : "warning";
    } else {
      severity = "safe";
    }
  }

  return {
    fileName,
    fileSize,
    declaredExtension,
    detectedSignatures,
    isExtensionMismatch,
    hexPreview,
    asciiPreview,
    severity,
  };
}
