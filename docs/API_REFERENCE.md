# CyberLab-ID — REST API Reference Specification (v2.5.0)

> **Base URL:** `https://cyberlab.id/api` (Production) / `http://localhost:3000/api` (Local)  
> **Format:** JSON (`Content-Type: application/json`)  
> **Tracing Header:** `x-request-id` (Correlation UUID attached to every response)

---

## 1. Standard Response Formats

### Successful Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-11-19T12:00:00.000Z"
  }
}
```

### Error Response:
```json
{
  "error": "Pesan deskripsi kesalahan dalam bahasa Indonesia yang ramah pengguna.",
  "code": "BAD_REQUEST",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 2. API Endpoints Catalog

### A. Health & Observability (Public)
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | System health probe (DB latency, uptime, Cyber Range status, memory RSS) | 60 req/min |
| `GET` | `/api/range/health` | Cyber Range runner diagnostics & template capacity | 60 req/min |

### B. Authentication & Profile (Session Cookie Protected)
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (username, email, password) | 5 req/15min |
| `POST` | `/api/auth/login` | Authenticate and issue secure session cookie | 5 req/15min |
| `POST` | `/api/auth/logout` | Revoke session and clear cookie | Unlimited |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & XP stats | 120 req/min |
| `PATCH` | `/api/auth/profile` | Update display name, bio, or avatar | 30 req/min |
| `POST` | `/api/auth/change-password` | Update account password with PBKDF2 salting | 5 req/15min |

### C. Capture The Flag (CTF) Platform
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/ctf/challenges` | List Jeopardy CTF challenges (**zero flag disclosure**) | 60 req/min |
| `POST` | `/api/ctf/submit` | Submit candidate flag (validated against SHA-256 hash) | 10 req/min |

### D. Leaderboard & Gamification (Public)
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/leaderboard` | Top users ranked by total XP (paged by 50) | 60 req/min |

### E. Community Forum
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/community/posts` | List discussion posts (filter by category, search) | 60 req/min |
| `POST` | `/api/community/posts` | Create new discussion topic (Auth required) | 10 req/min |
| `GET` | `/api/community/posts/[id]` | Get post detail and threaded comments | 60 req/min |
| `POST` | `/api/community/posts/[id]/comments` | Add comment to post | 20 req/min |
| `POST` | `/api/community/posts/[id]/like` | Toggle upvote on post | 60 req/min |
| `POST` | `/api/community/posts/[id]/report` | Submit moderation report on post | 10 req/min |

### F. Cyber Range & Virtual Lab
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/range/templates` | List published practical range templates | 60 req/min |
| `POST` | `/api/range/sessions` | Launch sandboxed lab session (Max 1 concurrent/user) | 5 req/min |
| `GET` | `/api/range/sessions/[id]` | Inspect active session details and remaining TTL | 120 req/min |
| `DELETE` | `/api/range/sessions/[id]` | Terminate and clean up session | 20 req/min |
| `POST` | `/api/range/sessions/[id]/exec` | Execute virtual shell command inside sandbox | 60 req/min |
| `POST` | `/api/range/sessions/[id]/complete` | Verify checkpoints and claim lab completion XP | 5 req/min |

### G. Administrative Management (RBAC Admin Role Required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/metrics` | Detailed system, DB, Range, and security telemetry |
| `GET` | `/api/admin/users` | List and search all registered user accounts |
| `PATCH` | `/api/admin/users/[id]` | Update user role (`user`, `moderator`, `admin`) or status |
| `GET` | `/api/admin/challenges` | List challenges with authoring metadata |
| `POST` | `/api/admin/challenges` | Create new CTF challenge with salted flag hash |
| `GET` | `/api/admin/range/sessions` | Inspect all running and historic Cyber Range sessions |
| `PATCH` | `/api/admin/range/sessions` | Force terminate any active lab session |
| `GET` | `/api/admin/reports` | Moderation queue for user-flagged forum content |
| `POST` | `/api/admin/reports/[id]/resolve` | Resolve moderation report |
