/**
 * Metadata Inspector - Core Logic
 * Extracts file metadata and parses JPEG EXIF headers directly from binary.
 * 100% client-side privacy.
 */

export interface ExifTag {
  tag: string;
  name: string;
  value: string;
}

export interface MetadataResult {
  fileName: string;
  fileSize: number;
  mimeType: string;
  lastModified: string;
  exifTags: ExifTag[];
  gps?: {
    latitude: number;
    longitude: number;
    mapsUrl: string;
  };
  warning?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function parseFileMetadata(file: File): Promise<MetadataResult> {
  const result: MetadataResult = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    lastModified: new Date(file.lastModified).toLocaleString("id-ID"),
    exifTags: [],
  };

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check if JPEG (0xFFD8)
    if (view.byteLength > 2 && view.getUint16(0) === 0xffd8) {
      parseJpegExif(view, result);
    }
  } catch (err) {
    console.warn("Could not parse detailed EXIF:", err);
  }

  return result;
}

function parseJpegExif(view: DataView, result: MetadataResult) {
  let offset = 2;
  const length = view.byteLength;

  while (offset < length - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    // APP1 Marker (0xFFE1) holds EXIF
    if (marker === 0xffe1) {
      const app1Length = view.getUint16(offset);
      offset += 2;

      // Check for 'Exif\0\0' (0x457869660000)
      const exifHeader = view.getUint32(offset);
      if (exifHeader === 0x45786966) {
        const tiffOffset = offset + 6;
        parseTiff(view, tiffOffset, result);
      }
      return;
    } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffd8 && marker !== 0xffd9) {
      // Skip other JPEG markers
      const markerLength = view.getUint16(offset);
      offset += markerLength;
    } else {
      break;
    }
  }
}

function parseTiff(view: DataView, tiffOffset: number, result: MetadataResult) {
  if (tiffOffset + 8 > view.byteLength) return;

  // Byte order: 0x4949 ('II') = Little Endian, 0x4D4D ('MM') = Big Endian
  const byteOrder = view.getUint16(tiffOffset);
  const littleEndian = byteOrder === 0x4949;

  // Verify TIFF magic number 42
  const magic = view.getUint16(tiffOffset + 2, littleEndian);
  if (magic !== 0x002a) return;

  const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
  if (tiffOffset + firstIfdOffset > view.byteLength) return;

  let ifdOffset = tiffOffset + firstIfdOffset;
  const numEntries = view.getUint16(ifdOffset, littleEndian);
  ifdOffset += 2;

  const TAG_NAMES: Record<number, string> = {
    0x010f: "Make (Merek Kamera)",
    0x0110: "Model Kamera",
    0x0112: "Orientation",
    0x0131: "Software Pengolah Gambar",
    0x0132: "DateTime (Waktu Pengambilan)",
    0x8769: "Exif IFD Pointer",
    0x8825: "GPS IFD Pointer",
  };

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = view.getUint32(entryOffset + 8, littleEndian);

    const tagName = TAG_NAMES[tag];
    if (tagName) {
      if (type === 2) {
        // ASCII string
        const strOffset = count > 4 ? tiffOffset + valueOffset : entryOffset + 8;
        let str = "";
        for (let j = 0; j < count - 1; j++) {
          if (strOffset + j < view.byteLength) {
            str += String.fromCharCode(view.getUint8(strOffset + j));
          }
        }
        if (str.trim()) {
          result.exifTags.push({
            tag: `0x${tag.toString(16).toUpperCase()}`,
            name: tagName,
            value: str.trim(),
          });
        }
      } else if (type === 3) {
        // Short integer
        const val = view.getUint16(entryOffset + 8, littleEndian);
        result.exifTags.push({
          tag: `0x${tag.toString(16).toUpperCase()}`,
          name: tagName,
          value: val.toString(),
        });
      }
    }
  }
}
