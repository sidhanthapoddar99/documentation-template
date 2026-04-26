---
title: Server Configuration
description: Configure Vite development server settings and allowed hosts
---

# Server Configuration

The `server` block configures Vite's development server settings, particularly for controlling which hosts are allowed to connect.

```yaml
server:
  allowedHosts: true  # Allow all hosts
```

Or with specific hosts:

```yaml
server:
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"
    - "my-app.local"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allowedHosts` | `true` \| `string[]` | No | Allow all hosts (`true`) or list of specific hostnames |

## `allowedHosts`

Controls which hostnames are permitted to access the development server. This is a security feature from Vite that prevents DNS rebinding attacks when the server is exposed to the network.

**Option 1: Allow all hosts (convenient for development)**

```yaml
server:
  allowedHosts: true
```

**Option 2: Specific hosts only (more secure)**

```yaml
server:
  allowedHosts:
    # Allow localhost variants
    - ".localhost"
    - "127.0.0.1"

    # Allow custom local domain
    - "my-app.local"

    # Allow ngrok tunnels
    - ".ngrok.io"
    - ".ngrok-free.app"

    # Allow specific subdomain
    - "dev.example.com"
```

**Pattern Syntax (when using array):**
- Use `.` prefix for wildcard subdomains: `.ngrok.io` matches `abc123.ngrok.io`
- Exact hostnames: `my-app.local` matches only that hostname
- IP addresses: `127.0.0.1`, `192.168.1.100`

**When to Use:**

Configure `allowedHosts` when:
- Using `HOST=true` in `.env` to enable network access
- Accessing the dev server via custom local domains
- Using tunneling services (ngrok, localtunnel, Cloudflare Tunnel)
- Developing on remote machines

**Related Setting:**

The `HOST` environment variable in `.env` controls whether the server accepts network connections:

```env
# Enable network access (required for allowedHosts to be relevant)
HOST=true
```

See [Environment Variables](../02_env.md#server-settings) for more details.
