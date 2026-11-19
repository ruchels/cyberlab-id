export interface LabTemplate {
  id: string;
  title: string;
  description: string;
  category: "Linux" | "Networking" | "Web Security" | "Digital Forensics" | "Reverse Engineering";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration_minutes: number;
  xp_reward: number;
  cpu_limit: string;
  memory_limit: string;
  storage_limit: string;
  image_name: string;
  instructions: string;
  verification_criteria: string;
  is_published: number;
  version: string;
  created_at: string;
  updated_at: string;
}

export type LabSessionStatus =
  | "pending"
  | "starting"
  | "running"
  | "stopping"
  | "completed"
  | "expired"
  | "failed";

export interface LabSession {
  id: string;
  user_id: string;
  template_id: string;
  status: LabSessionStatus;
  mode: "container" | "embedded";
  terminal_endpoint: string;
  ip_address: string;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  checkpoints_state: string;
  terminal_history: string;
  created_at: string;
  template?: LabTemplate;
}

export interface TerminalExecutionResult {
  output: string;
  exitCode: number;
  prompt: string;
  updatedCheckpoints: Record<string, boolean>;
  allCheckpointsPassed: boolean;
}

export interface CyberRangeHealth {
  status: "healthy" | "degraded";
  activeDriver: "Docker Container Daemon" | "Isolated Embedded Lab Engine";
  isDockerAvailable: boolean;
  totalActiveSessions: number;
  totalCompletedSessions: number;
  systemResourceLimits: {
    maxDurationMinutes: number;
    maxConcurrentSessionsPerUser: number;
    defaultCpuLimit: string;
    defaultMemoryLimit: string;
  };
  supportedTemplatesCount: number;
}
