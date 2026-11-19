/**
 * Cipher Toolkit - Core Cryptography & Encoding Logic
 * Classical ciphers, XOR, and Base64 implementations
 */

// 1. CAESAR CIPHER
export function caesarCipher(text: string, shift: number, decrypt = false): string {
  const s = decrypt ? (26 - (shift % 26)) % 26 : (shift % 26 + 26) % 26;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      // Uppercase A-Z (65-90)
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + s) % 26) + 65);
      }
      // Lowercase a-z (97-122)
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + s) % 26) + 97);
      }
      return char;
    })
    .join("");
}

export function caesarBruteForce(text: string): Array<{ shift: number; result: string }> {
  const results: Array<{ shift: number; result: string }> = [];
  for (let shift = 1; shift < 26; shift++) {
    results.push({
      shift,
      result: caesarCipher(text, shift, true),
    });
  }
  return results;
}

// 2. ROT13 (Self-inverse Caesar shift 13)
export function rot13(text: string): string {
  return caesarCipher(text, 13);
}

// 3. XOR CIPHER
export function xorCipher(text: string, key: string): { ascii: string; hex: string } {
  if (!text || !key) return { ascii: "", hex: "" };

  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const keyBytes = encoder.encode(key);

  const xorBytes = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    xorBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Hex representation
  const hex = Array.from(xorBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  // Printable representation
  let ascii = "";
  for (let i = 0; i < xorBytes.length; i++) {
    const b = xorBytes[i];
    // Printable ASCII: 32 - 126
    if (b >= 32 && b <= 126) {
      ascii += String.fromCharCode(b);
    } else {
      ascii += `\\x${b.toString(16).padStart(2, "0")}`;
    }
  }

  return { ascii, hex };
}

// 4. BASE64 ENCODING / DECODING WITH UNICODE SUPPORT
export function base64Encode(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64Decode(b64: string): string {
  // Strip whitespace
  const cleanB64 = b64.replace(/\s+/g, "");
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// 5. VIGENÈRE CIPHER
export function vigenereCipher(text: string, key: string, decrypt = false): string {
  if (!key) return text;
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (cleanKey.length === 0) return text;

  let keyIndex = 0;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      let isUpper = false;
      let offset = 0;

      if (code >= 65 && code <= 90) {
        isUpper = true;
        offset = 65;
      } else if (code >= 97 && code <= 122) {
        isUpper = false;
        offset = 97;
      } else {
        return char;
      }

      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      keyIndex++;

      const effectiveShift = decrypt ? (26 - shift) % 26 : shift;
      const newChar = String.fromCharCode(((code - offset + effectiveShift) % 26) + offset);
      return newChar;
    })
    .join("");
}

// 6. HEXADECIMAL CONVERSION
export function textToHex(text: string, separator = " "): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(separator);
}

export function hexToText(hex: string): string {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Panjang string heksadesimal harus genap (kelipatan 2 karakter)");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}
