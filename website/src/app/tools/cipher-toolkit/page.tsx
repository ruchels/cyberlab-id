"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "@/lib/tools/cipher";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { KeyRound, ArrowLeft, Copy, Check, RefreshCw, Eye, BookOpen, Binary } from "lucide-react";

type CipherTab = "caesar" | "rot13" | "xor" | "base64" | "hex" | "vigenere";

export default function CipherToolkitPage() {
  const [activeTab, setActiveTab] = useState<CipherTab>("caesar");
  const [copied, setCopied] = useState(false);

  // Caesar State
  const [caesarInput, setCaesarInput] = useState("Fdhvdu flskhu lv ixq");
  const [caesarShift, setCaesarShift] = useState(3);
  const [caesarMode, setCaesarMode] = useState<"decrypt" | "encrypt">("decrypt");
  const [showBruteForce, setShowBruteForce] = useState(false);

  // ROT13 State
  const [rot13Input, setRot13Input] = useState("PloreYno-VQ vf nznmvat!");

  // XOR State
  const [xorInput, setXorInput] = useState("CyberLab-ID");
  const [xorKey, setXorKey] = useState("secret");

  // Base64 State
  const [b64Input, setB64Input] = useState("Q3liZXJMYWItSUQ=");
  const [b64Mode, setB64Mode] = useState<"decode" | "encode">("decode");
  const [b64Error, setB64Error] = useState<string | null>(null);

  // Vigenère State
  const [vigenereInput, setVigenereInput] = useState("KevivPah-QF");
  const [vigenereKey, setVigenereKey] = useState("CYBER");
  const [vigenereMode, setVigenereMode] = useState<"decrypt" | "encrypt">("decrypt");

  // Hexadecimal State
  const [hexInput, setHexInput] = useState("CyberLab-ID");
  const [hexMode, setHexMode] = useState<"toHex" | "fromHex">("toHex");
  const [hexError, setHexError] = useState<string | null>(null);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Computations
  const caesarOutput = caesarCipher(caesarInput, caesarShift, caesarMode === "decrypt");
  const rot13Output = rot13(rot13Input);
  const xorOutput = xorCipher(xorInput, xorKey);
  const vigenereOutput = vigenereCipher(vigenereInput, vigenereKey, vigenereMode === "decrypt");

  let b64Output = "";
  try {
    b64Output = b64Mode === "encode" ? base64Encode(b64Input) : base64Decode(b64Input);
    if (b64Error) setB64Error(null);
  } catch (err) {
    b64Output = "";
    if (!b64Error) setB64Error("Format Base64 tidak valid.");
  }

  let hexOutput = "";
  try {
    if (hexMode === "toHex") {
      hexOutput = textToHex(hexInput);
    } else {
      hexOutput = hexToText(hexInput);
    }
    if (hexError) setHexError(null);
  } catch (err: unknown) {
    hexOutput = "";
    if (!hexError) setHexError(err instanceof Error ? err.message : "String Hexadecimal tidak valid.");
  }

  const tabs: { id: CipherTab; label: string; tag: string }[] = [
    { id: "caesar", label: "Caesar Cipher", tag: "Substitusi" },
    { id: "rot13", label: "ROT13", tag: "Shift 13" },
    { id: "xor", label: "XOR Cipher", tag: "Bitwise" },
    { id: "base64", label: "Base64", tag: "Encoding" },
    { id: "hex", label: "Hexadecimal", tag: "Encoding" },
    { id: "vigenere", label: "Vigenère Cipher", tag: "Polialfabetik" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Tools
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--color-text)] flex items-center gap-3">
              <KeyRound className="w-7 h-7 text-[var(--color-accent)]" />
              Cipher & Encoding Toolkit
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Toolkit praktikum kriptografi klasik dan encoding yang sering muncul pada kompetisi CTF dan audit keamanan.
            </p>
          </div>
          <Badge variant="accent" size="md">
            CTF Ready
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--color-accent)] text-[#05080e] font-bold shadow-sm"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded ${
                activeTab === tab.id
                  ? "bg-black/20 text-[#05080e]"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
              }`}
            >
              {tab.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: CAESAR CIPHER */}
      {activeTab === "caesar" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
                Caesar Shift Cipher
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Algoritma substitusi monoalfabetik dengan menggeser setiap karakter alfabet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={caesarMode === "decrypt" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCaesarMode("decrypt")}
              >
                Dekripsi (Decode)
              </Button>
              <Button
                variant={caesarMode === "encrypt" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCaesarMode("encrypt")}
              >
                Enkripsi (Encode)
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                Teks Input
              </label>
              <textarea
                value={caesarInput}
                onChange={(e) => setCaesarInput(e.target.value)}
                rows={3}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)]">
                  Besar Pergeseran (Shift):{" "}
                  <strong className="text-[var(--color-accent)] font-bold text-sm">
                    {caesarShift}
                  </strong>
                </span>
                <button
                  onClick={() => setShowBruteForce(!showBruteForce)}
                  className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showBruteForce ? "Tutup Brute Force" : "Buka CTF Brute Force (All 25 Shifts)"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={caesarShift}
                onChange={(e) => setCaesarShift(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil {caesarMode === "decrypt" ? "Dekripsi" : "Enkripsi"}
                </span>
                <button
                  onClick={() => copyText(caesarOutput)}
                  className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div className="p-3.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-sm text-emerald-300 break-all select-all">
                {caesarOutput || "(Hasil kosong)"}
              </div>
            </div>

            {/* Brute Force Table for CTF */}
            {showBruteForce && (
              <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                <h4 className="text-xs font-mono font-bold text-[var(--color-text)]">
                  ⚡ CTF Brute Force Matrix (Cari teks yang terbaca manusia):
                </h4>
                <div className="max-h-60 overflow-y-auto border border-[var(--color-border)] rounded divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                  {caesarBruteForce(caesarInput).map((item) => (
                    <div
                      key={item.shift}
                      onClick={() => setCaesarShift(item.shift)}
                      className={`px-3 py-2 flex items-center justify-between hover:bg-[var(--color-surface-elevated)] cursor-pointer ${
                        caesarShift === item.shift ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)]" : ""
                      }`}
                    >
                      <span className="w-20 text-[var(--color-text-muted)]">
                        Shift -{item.shift}:
                      </span>
                      <span className="flex-1 truncate text-[var(--color-text)]">
                        {item.result}
                      </span>
                      <span className="text-[10px] text-[var(--color-accent)] opacity-60">Pilih</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 2: ROT13 */}
      {activeTab === "rot13" && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
              ROT13 (Rotate by 13 places)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Simetris & self-inverse: Mengenkripsi atau mendekripsi teks dua kali mengembalikannya ke teks semula ($ROT13(ROT13(x)) = x$).
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                Teks Input
              </label>
              <textarea
                value={rot13Input}
                onChange={(e) => setRot13Input(e.target.value)}
                rows={3}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil ROT13
                </span>
                <button
                  onClick={() => copyText(rot13Output)}
                  className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div className="p-3.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-sm text-emerald-300 break-all select-all">
                {rot13Output}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 3: XOR CIPHER */}
      {activeTab === "xor" && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
              XOR Bitwise Cipher (Repeating Key)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Operasi bitwise fundamental dalam malware obfuscation dan Stream Ciphers (One-Time Pad / ChaCha20).
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                  Teks Input (Plaintext / Ciphertext)
                </label>
                <textarea
                  value={xorInput}
                  onChange={(e) => setXorInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                  Kunci XOR (Key)
                </label>
                <input
                  type="text"
                  value={xorKey}
                  onChange={(e) => setXorKey(e.target.value)}
                  placeholder="Kunci rahasia..."
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-2.5 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                />
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Kunci akan diulang (repeating) jika panjang input melebihi panjang kunci.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-secondary)]">
                    Hasil Hexadecimal (Byte Stream):
                  </span>
                  <button
                    onClick={() => copyText(xorOutput.hex)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                  >
                    Salin Hex
                  </button>
                </div>
                <div className="p-3 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-xs text-amber-300 break-all select-all">
                  {xorOutput.hex || "(Masukkan teks dan kunci)"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-secondary)]">
                    Hasil Karakter / ASCII Printable:
                  </span>
                  <button
                    onClick={() => copyText(xorOutput.ascii)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                  >
                    Salin ASCII
                  </button>
                </div>
                <div className="p-3 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-xs text-emerald-300 break-all select-all">
                  {xorOutput.ascii || "(Masukkan teks dan kunci)"}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 4: BASE64 */}
      {activeTab === "base64" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
                Base64 Binary-to-Text Encoding
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                PENTING: Base64 adalah encoding untuk transmisi data 8-bit melalui kanal ASCII, BUKAN enkripsi pengaman!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={b64Mode === "decode" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setB64Mode("decode")}
              >
                Decode Base64
              </Button>
              <Button
                variant={b64Mode === "encode" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setB64Mode("encode")}
              >
                Encode ke Base64
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                {b64Mode === "decode" ? "String Base64 yang akan di-decode" : "Teks Biasa (UTF-8) yang akan di-encode"}
              </label>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                rows={3}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              {b64Error && <p className="text-xs text-rose-400 font-mono">{b64Error}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil {b64Mode === "decode" ? "Teks Asli" : "String Base64"}
                </span>
                <button
                  onClick={() => copyText(b64Output)}
                  className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div className="p-3.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-sm text-emerald-300 break-all select-all">
                {b64Output || "(Menunggu input valid...)"}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 5: HEXADECIMAL */}
      {activeTab === "hex" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
                Hexadecimal (Base16) Converter
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Konversi teks biner ke representasi byte heksadesimal dua digit (0-9, A-F) dan sebaliknya.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={hexMode === "toHex" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setHexMode("toHex")}
              >
                Teks ke Hex
              </Button>
              <Button
                variant={hexMode === "fromHex" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setHexMode("fromHex")}
              >
                Hex ke Teks
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                {hexMode === "toHex" ? "Teks String (ASCII/UTF-8)" : "String Heksadesimal (Hex Bytes)"}
              </label>
              <textarea
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder={hexMode === "toHex" ? "Masukkan teks..." : "Contoh: 43 79 62 65 72..."}
                rows={3}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              {hexError && <p className="text-xs text-rose-400 font-mono">{hexError}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil {hexMode === "toHex" ? "Hexadecimal Stream" : "Teks Asli"}
                </span>
                <button
                  onClick={() => copyText(hexOutput)}
                  className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div className="p-3.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-sm text-emerald-300 break-all select-all">
                {hexOutput || "(Menunggu input valid...)"}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 6: VIGENÈRE */}
      {activeTab === "vigenere" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-mono font-bold text-[var(--color-text)]">
                Vigenère Polyalphabetic Cipher
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Substitusi polialfabetik menggunakan kata kunci berulang untuk meredam analisis frekuensi sederhana.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={vigenereMode === "decrypt" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setVigenereMode("decrypt")}
              >
                Dekripsi
              </Button>
              <Button
                variant={vigenereMode === "encrypt" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setVigenereMode("encrypt")}
              >
                Enkripsi
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                  Teks Input
                </label>
                <textarea
                  value={vigenereInput}
                  onChange={(e) => setVigenereInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-[var(--color-text-secondary)]">
                  Kata Kunci (Alphabet Keyword)
                </label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value)}
                  placeholder="Misal: SECRET"
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded p-2.5 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-secondary)] uppercase">
                  Hasil {vigenereMode === "decrypt" ? "Dekripsi" : "Enkripsi"}
                </span>
                <button
                  onClick={() => copyText(vigenereOutput)}
                  className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <div className="p-3.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] font-mono text-sm text-emerald-300 break-all select-all">
                {vigenereOutput}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Educational Guide: Encoding vs Encryption vs Hashing */}
      <Card className="border-[var(--color-border)]">
        <CardHeader>
          <h3 className="font-mono text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-accent)]" />
            Konsep Wajib: Perbedaan Fundamental Encoding vs Enkripsi vs Hashing
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-subtle)] text-xs">
            <div className="p-5 space-y-2">
              <div className="font-mono font-bold text-[var(--color-accent)] uppercase">
                1. Encoding (Base64, Hex)
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Transformasi representasi biner ke teks untuk kompatibilitas kanal komunikasi. <strong>BUKAN untuk keamanan</strong>. Siapapun dapat mengembalikan ke bentuk asli secara instan tanpa kunci.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <div className="font-mono font-bold text-amber-400 uppercase">
                2. Enkripsi (AES, RSA)
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Transformasi data menjadi ciphertext matematis menggunakan <strong>Kunci Rahasia</strong>. Bersifat dua arah (reversible) khusus bagi pihak yang memegang kunci yang sah untuk menjaga kerahasiaan.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <div className="font-mono font-bold text-sky-400 uppercase">
                3. Hashing (SHA-256, Bcrypt)
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Fungsi matematika satu arah (irreversible). Menghasilkan sidik jari digital (digest) berukuran tetap dari input apapun. Dipakai untuk <strong>integritas data dan verifikasi password</strong>.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Educational Footer */}
      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] space-y-2">
        <h4 className="font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-accent)]" />
          Pembelajaran: Mengapa Kriptografi Klasik Tidak Digunakan untuk Mengamankan Data Modern?
        </h4>
        <p>
          Cipher klasik seperti Caesar dan Vigenère rentan terhadap <strong>Frequency Analysis</strong> (analisis kemunculan huruf paling sering, seperti huruf &apos;e&apos; atau &apos;a&apos; dalam bahasa alami). Namun, prinsip dasar substitusi dan permutasi dari cipher klasik inilah yang menjadi fondasi algoritma modern seperti <strong>AES (Advanced Encryption Standard)</strong> melalui struktur SP-network (Substitution-Permutation Network).
        </p>
      </div>
    </div>
  );
}
