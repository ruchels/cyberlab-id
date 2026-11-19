import { execSync } from "node:child_process";
import type { CyberRangeHealth, TerminalExecutionResult } from "./types.ts";
import { getDb } from "../db.ts";

let isDockerDetected: boolean | null = null;

export function checkDockerAvailable(): boolean {
  if (isDockerDetected !== null) return isDockerDetected;
  try {
    execSync("docker --version", { stdio: "ignore", timeout: 2000 });
    isDockerDetected = true;
  } catch {
    isDockerDetected = false;
  }
  return isDockerDetected;
}

export function getCyberRangeHealth(): CyberRangeHealth {
  const db = getDb();
  const hasDocker = checkDockerAvailable();

  const activeCount = (
    db
      .prepare("SELECT count(*) as count FROM lab_sessions WHERE status = 'running'")
      .get() as { count: number }
  ).count;

  const completedCount = (
    db
      .prepare("SELECT count(*) as count FROM lab_completions")
      .get() as { count: number }
  ).count;

  const templatesCount = (
    db
      .prepare("SELECT count(*) as count FROM lab_templates WHERE is_published = 1")
      .get() as { count: number }
  ).count;

  return {
    status: "healthy",
    activeDriver: hasDocker ? "Docker Container Daemon" : "Isolated Embedded Lab Engine",
    isDockerAvailable: hasDocker,
    totalActiveSessions: activeCount,
    totalCompletedSessions: completedCount,
    systemResourceLimits: {
      maxDurationMinutes: 120,
      maxConcurrentSessionsPerUser: 1,
      defaultCpuLimit: "0.5 core",
      defaultMemoryLimit: "256 MB",
    },
    supportedTemplatesCount: templatesCount,
  };
}

// In-memory virtual environment filesystem & state per session
interface VirtualLabState {
  currentDir: string;
  files: Record<string, { content: string; permissions: string; owner: string }>;
  env: Record<string, string>;
  checkpoints: Record<string, boolean>;
}

const sessionStates = new Map<string, VirtualLabState>();

export function getOrCreateVirtualState(sessionId: string, initialCheckpoints: Record<string, boolean> = {}): VirtualLabState {
  let state = sessionStates.get(sessionId);
  if (!state) {
    state = {
      currentDir: "/home/student",
      files: {
        "/home/student/README.txt": {
          content: "Selamat datang di CyberLab-ID Virtual Linux Range!\nGunakan perintah standar bash untuk menyelesaikan latihan.",
          permissions: "-rw-r--r--",
          owner: "student",
        },
        "/home/student/notes.txt": {
          content: "Daftar to-do audit keamanan:\n1. Cek direktori /opt/secret\n2. Atur izin akses ke 600\n3. Cari binary SUID",
          permissions: "-rw-r--r--",
          owner: "student",
        },
        "/opt/secret/creds.txt": {
          content: "DATABASE_PASS=MasterSec_KucingTerbang99!\nJWT_SECRET=super_secret_signing_key_2026",
          permissions: "-rw-r--r--",
          owner: "root",
        },
        "/usr/bin/custom-ping": {
          content: "#!/bin/bash\n# SUID Ping binary simulation\necho 'Ping tool v1.2'",
          permissions: "-rwsr-xr-x",
          owner: "root",
        },
      },
      env: {
        USER: "student",
        HOME: "/home/student",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        TERM: "xterm-256color",
      },
      checkpoints: { ...initialCheckpoints },
    };
    sessionStates.set(sessionId, state);
  }
  return state;
}

export function executeVirtualCommand(
  sessionId: string,
  rawCmd: string,
  criteriaJson: string
): TerminalExecutionResult {
  const state = getOrCreateVirtualState(sessionId);
  const trimmed = rawCmd.trim();
  const prompt = `student@cyberlab-range:${state.currentDir === "/home/student" ? "~" : state.currentDir}$ `;

  if (!trimmed) {
    return {
      output: "",
      exitCode: 0,
      prompt,
      updatedCheckpoints: state.checkpoints,
      allCheckpointsPassed: false,
    };
  }

  // Parse criteria for checkpoint triggers
  let criteriaObj: any = {};
  try {
    criteriaObj = JSON.parse(criteriaJson);
  } catch {}

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  let output = "";
  let exitCode = 0;

  switch (command) {
    case "pwd":
      output = state.currentDir;
      break;

    case "whoami":
      output = state.env.USER;
      break;

    case "clear":
      output = "\x1bc"; // ANSI clear screen code
      break;

    case "uname":
      if (args.includes("-a")) {
        output = "Linux cyberlab-range 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux";
      } else {
        output = "Linux";
      }
      break;

    case "id":
      output = "uid=1000(student) gid=1000(student) groups=1000(student),4(adm),27(sudo)";
      break;

    case "ls": {
      const targetDir = args.length > 0 && !args[0].startsWith("-") ? args[0] : state.currentDir;
      const resolved = targetDir.startsWith("/") ? targetDir : `${state.currentDir}/${targetDir}`.replace(/\/+/g, "/");

      if (args.includes("-la") || args.includes("-l")) {
        let lines = ["total 16", "drwxr-xr-x 2 student student 4096 Nov 19 11:30 .", "drwxr-xr-x 4 root    root    4096 Nov 19 11:00 .."];
        for (const [path, info] of Object.entries(state.files)) {
          if (path.startsWith(resolved)) {
            const fileName = path.split("/").pop();
            lines.push(`${info.permissions} 1 ${info.owner} ${info.owner} ${info.content.length} Nov 19 11:30 ${fileName}`);
          }
        }
        output = lines.join("\n");
      } else {
        const found = Object.keys(state.files)
          .filter((p) => p.startsWith(resolved))
          .map((p) => p.split("/").pop());
        output = found.join("  ");
      }

      if (trimmed.includes("/opt/secret") || resolved === "/opt/secret") {
        state.checkpoints["chk_ls"] = true;
      }
      break;
    }

    case "cd": {
      const dest = args[0] || "/home/student";
      let resolved = dest;
      if (dest === "~" || dest === "") resolved = "/home/student";
      else if (dest === "..") {
        const segs = state.currentDir.split("/").filter(Boolean);
        segs.pop();
        resolved = segs.length === 0 ? "/" : `/${segs.join("/")}`;
      } else if (!dest.startsWith("/")) {
        resolved = `${state.currentDir}/${dest}`.replace(/\/+/g, "/");
      }

      if (["/home/student", "/opt/secret", "/var/log", "/tmp", "/etc", "/"].includes(resolved)) {
        state.currentDir = resolved;
        output = "";
      } else {
        output = `bash: cd: ${dest}: No such file or directory`;
        exitCode = 1;
      }
      break;
    }

    case "cat": {
      if (args.length === 0) {
        output = "cat: missing file operand";
        exitCode = 1;
        break;
      }
      const target = args[0].startsWith("/") ? args[0] : `${state.currentDir}/${args[0]}`.replace(/\/+/g, "/");
      const file = state.files[target];
      if (file) {
        output = file.content;
      } else {
        output = `cat: ${args[0]}: No such file or directory`;
        exitCode = 1;
      }
      break;
    }

    case "chmod": {
      if (args.length < 2) {
        output = "chmod: missing operand";
        exitCode = 1;
      } else {
        const mode = args[0];
        const target = args[1].startsWith("/") ? args[1] : `${state.currentDir}/${args[1]}`.replace(/\/+/g, "/");
        if (state.files[target]) {
          state.files[target].permissions = mode === "600" ? "-rw-------" : "-rwxr-xr-x";
          output = "";
          if (mode === "600" && target.includes("creds.txt")) {
            state.checkpoints["chk_chmod"] = true;
          }
        } else {
          output = `chmod: cannot access '${args[1]}': No such file or directory`;
          exitCode = 1;
        }
      }
      break;
    }

    case "ps":
      output = `  PID TTY          TIME CMD\n 1402 pts/0    00:00:00 bash\n 1845 pts/0    00:00:00 cyberlab-worker\n 1920 pts/0    00:00:00 ps`;
      break;

    case "top":
      output = `top - 11:35:00 up 2:10,  1 user,  load average: 0.08, 0.04, 0.01\nTasks:  3 total,   1 running,   2 sleeping,   0 stopped\n%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.4 id\nMiB Mem :    256.0 total,    184.2 free,     52.1 used\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 1402 student   20   0   14240   4820   3120 S   0.0   1.8   0:00.12 bash\n 1845 student   20   0  128400  32100  18400 S   0.1  12.5   0:01.45 cyberlab-worker`;
      break;

    case "find": {
      if (trimmed.includes("-perm -4000") || trimmed.includes("4000")) {
        output = `/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/custom-ping\n/usr/bin/newgrp`;
        state.checkpoints["chk_suid"] = true;
      } else {
        output = Object.keys(state.files).join("\n");
      }
      break;
    }

    case "grep": {
      if (args.length < 2) {
        output = "grep: missing pattern or file";
        exitCode = 1;
      } else {
        const pattern = args[0];
        const target = args[1].startsWith("/") ? args[1] : `${state.currentDir}/${args[1]}`.replace(/\/+/g, "/");
        const file = state.files[target];
        if (file) {
          const lines = file.content.split("\n").filter((l) => l.includes(pattern));
          output = lines.join("\n");
        } else {
          output = `grep: ${args[1]}: No such file or directory`;
          exitCode = 1;
        }
      }
      break;
    }

    case "ip":
      output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\n    inet 10.240.0.15/24 brd 10.240.0.255 scope global eth0`;
      break;

    case "ping": {
      const host = args[0] || "127.0.0.1";
      output = `PING ${host} (${host}) 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.241 ms\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.188 ms\n\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, time 1002ms`;
      break;
    }

    case "help":
      output = `CyberLab-ID Range Shell v2.4 (Isolated Safe Sandbox)\nAvailable commands:\n  pwd, whoami, ls, cd, cat, chmod, grep, find, ps, top, ip, ping, clear, uname, id, help`;
      break;

    default:
      output = `bash: ${command}: command not found. Ketik 'help' untuk daftar perintah yang didukung.`;
      exitCode = 127;
  }

  // Check if all checkpoints defined in criteria are passed
  const checkpointsList = criteriaObj.checkpoints || [];
  let allPassed = false;
  if (checkpointsList.length > 0) {
    allPassed = checkpointsList.every((cp: any) => Boolean(state.checkpoints[cp.id]));
  }

  const updatedPrompt = `student@cyberlab-range:${state.currentDir === "/home/student" ? "~" : state.currentDir}$ `;

  return {
    output,
    exitCode,
    prompt: updatedPrompt,
    updatedCheckpoints: state.checkpoints,
    allCheckpointsPassed: allPassed,
  };
}
