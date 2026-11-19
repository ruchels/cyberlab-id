import { md5 } from "./website/src/lib/tools/hash.ts";
import { calculateSubnet } from "./website/src/lib/tools/subnet.ts";
import {
  caesarCipher,
  caesarBruteForce,
  rot13,
  xorCipher,
  base64Encode,
  base64Decode,
  vigenereCipher,
  textToHex,
  hexToText,
} from "./website/src/lib/tools/cipher.ts";
import { analyzePassword } from "./website/src/lib/tools/password.ts";
import { analyzeFileSignature } from "./website/src/lib/tools/file-signature.ts";

console.log("==========================================");
console.log("CYBERLAB-ID AUTOMATED VERIFICATION SUITE");
console.log("==========================================");

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. MD5 Verification
assert(
  md5("") === "d41d8cd98f00b204e9800998ecf8427e",
  "MD5 empty string produces standard RFC 1321 hash"
);
assert(
  md5("cyberlab") === "a59f94ef98caeb4cac0c900c2fa730a6",
  "MD5 of 'cyberlab' matches standard RFC 1321 digest"
);

// 2. Subnet Calculator Verification
const sub24 = calculateSubnet("192.168.1.100", 24);
assert(sub24.networkAddress === "192.168.1.0", "192.168.1.100/24 Network is 192.168.1.0");
assert(sub24.broadcastAddress === "192.168.1.255", "192.168.1.100/24 Broadcast is 192.168.1.255");
assert(sub24.subnetMask === "255.255.255.0", "192.168.1.100/24 Mask is 255.255.255.0");
assert(sub24.usableHosts === 254, "192.168.1.100/24 Usable hosts is 254");
assert(sub24.firstUsableHost === "192.168.1.1", "192.168.1.100/24 First host is 192.168.1.1");
assert(sub24.lastUsableHost === "192.168.1.254", "192.168.1.100/24 Last host is 192.168.1.254");
assert(sub24.isPrivate === true, "192.168.1.100 is Private RFC 1918");

const sub22 = calculateSubnet("172.16.50.0", 22);
assert(sub22.usableHosts === 1022, "172.16.50.0/22 Usable hosts is 1022");
assert(sub22.totalHosts === 1024, "172.16.50.0/22 Total hosts is 1024");

// 3. Cipher Toolkit Verification
const decodedCaesar = caesarCipher("Fdhvdu flskhu lv ixq", 3, true);
assert(decodedCaesar === "Caesar cipher is fun", "Caesar shift 3 decrypts 'Fdhvdu flskhu lv ixq'");

const brute = caesarBruteForce("Fdhvdu flskhu lv ixq");
assert(brute.length === 25, "Caesar brute force produces 25 matrix variations");
assert(brute.some((b) => b.result === "Caesar cipher is fun"), "Caesar brute force contains the plaintext");

const rot = rot13(rot13("CyberLab-ID 2026!"));
assert(rot === "CyberLab-ID 2026!", "ROT13 is self-inverse for alphanumeric string");

const b64e = base64Encode("CyberLab-ID");
assert(b64e === "Q3liZXJMYWItSUQ=", "Base64 encodes 'CyberLab-ID' to 'Q3liZXJMYWItSUQ='");
const b64d = base64Decode("Q3liZXJMYWItSUQ=");
assert(b64d === "CyberLab-ID", "Base64 decodes 'Q3liZXJMYWItSUQ=' back to 'CyberLab-ID'");

const vigEnc = vigenereCipher("ATTACKATDAWN", "LEMON", false);
assert(vigEnc === "LXFOPVEFRNHR", "Vigenere standard vector ATTACKATDAWN + LEMON = LXFOPVEFRNHR");
const vigDec = vigenereCipher("LXFOPVEFRNHR", "LEMON", true);
assert(vigDec === "ATTACKATDAWN", "Vigenere decrypts LXFOPVEFRNHR back to ATTACKATDAWN");

const hexStr = textToHex("CyberLab");
assert(hexStr === "43 79 62 65 72 4c 61 62", "textToHex correctly encodes 'CyberLab'");
const textStr = hexToText("43 79 62 65 72 4c 61 62");
assert(textStr === "CyberLab", "hexToText correctly decodes '43 79 62 65 72 4c 61 62' back to 'CyberLab'");


// 4. Password Analyzer Verification
const pwWeak = analyzePassword("123456");
assert(pwWeak.strength === "Sangat Lemah", "Password '123456' marked 'Sangat Lemah'");
assert(pwWeak.detectedPatterns.length > 0, "Password '123456' detects common wordlist pattern");

const pwStrong = analyzePassword("Kucing-Merah-Terbang-Sepatu-2026!");
assert(
  pwStrong.strength === "Sangat Kuat" || pwStrong.strength === "Kuat",
  "Passphrase 30+ chars with symbols scores high"
);
assert(pwStrong.entropyBits > 60, "Passphrase entropy exceeds 60 bits");

// 5. File Signature Verification
const pngBuffer = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]).buffer;
const pngAnalysis = analyzeFileSignature("image.png", pngBuffer);
assert(pngAnalysis.detectedSignatures[0]?.extension === "png", "Correctly identifies PNG Magic Bytes");
assert(pngAnalysis.isExtensionMismatch === false, "Legitimate PNG matches declared extension");

const spoofedBuffer = new Uint8Array([
  0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
]).buffer;
const spoofedAnalysis = analyzeFileSignature("document.pdf", spoofedBuffer);
assert(
  spoofedAnalysis.isExtensionMismatch === true,
  "Detects PE/EXE binary disguised as PDF (Extension Spoofing)"
);
assert(spoofedAnalysis.severity === "danger", "Executable masquerading as PDF flagged as DANGER");

console.log("==========================================");
console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
console.log("==========================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
