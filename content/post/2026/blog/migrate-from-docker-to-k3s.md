---
title: Boring Kubernetes
description: A Private, Production-Ready Homelab with K3s & Tailscale
date: 2026-01-22
slug: k3s-migration
categories:
  - exp
tags:
  - exp
  - life
created: 2025-09-15 23:47
modified: 2025-12-08 14:39
---

I recently migrated my home server (23 services including Immich, Vaultwarden, Jellyfin, and a complete monitoring stack) from Docker Compose to **k3s**. This is the story of building a "boring but reliable" Kubernetes homelab that prioritizes privacy, simplicity, and actual production readiness.

The standard advice for homelabs is "stick to Docker Compose." While valid for simple setups, I wanted the declarative state management, proper resource limits, and zero-downtime updates of Kubernetes—without the operational nightmare of a full multi-node cluster.

Here's how I built a single-node K3s setup that handles 28 pods across 7 namespaces, with zero open ports, dual-access networking, and a 3-layer backup strategy.

## The Problem: Docker Compose Growing Pains

My original Docker Compose setup worked, but had issues:

- **Resource chaos:** No memory limits meant Immich could OOM the entire host
- **Update anxiety:** `docker-compose down && up` meant downtime for all services
- **Network complexity:** Exposing 23 services meant managing 23 different ports or a complex reverse proxy
- **Backup uncertainty:** File-based backups of database directories felt fragile
- **No rollback:** Breaking changes meant scrambling through git history

I didn't need Kubernetes for the sake of Kubernetes. I needed **better primitives** for managing a production-like homelab.

## The Architecture: Single Node, Multi-Layer Design

**Hardware:** Generic Mini PC
**Specs:** 8 cores, 32GB RAM, 1TB NVMe
**OS:** Ubuntu 22.04 LTS
**Orchestrator:** K3s v1.28 (lightweight Kubernetes)
**Storage:** Default `local-path-provisioner` (no Longhorn/Ceph complexity)

### 1. The Network Stack: Dual-Access with Tailscale

This was the most interesting part of the setup. I needed:

- **Low-latency home access** for 4K streaming (Jellyfin, Navidrome)
- **Secure remote access** from anywhere (phone, laptop, office)
- **Zero public exposure** (no open ports on router)

#### Initial Attempt: Tailscale Operator (Failed)

I started with the **Tailscale Kubernetes Operator**, which creates a LoadBalancer service for each exposed app. For 23 services, that meant 23 proxy pods.

**The problems:**

- High memory overhead (~100MB per proxy pod = 2.3GB wasted)
- High latency (~20-50ms added) even on same WiFi
- Complex resource management

**The pivot:** I deleted the operator entirely.

#### Current Solution: Tailscale Subnet Router + Dual Access

**For remote access (Tailscale Subnet Router):**

Single deployment that advertises K3s network CIDRs to Tailscale:

- Pod CIDR: `10.42.0.0/16`
- Service CIDR: `10.43.0.0/16`

```yaml
# Single pod (~100MB RAM total)
env:
  - name: TS_ROUTES
    value: "10.42.0.0/16,10.43.0.0/16"
  - name: TS_USERSPACE
    value: "false"
```

**Result:** Access any service via its Kubernetes DNS name:

```
http://jellyfin.harus-media.svc.cluster.local
http://grafana.harus-infrastructure.svc.cluster.local
```

**For home network access (NodePort):**

For high-bandwidth services (4K video, lossless audio), I added NodePort services:

```yaml
# Direct LAN access on home WiFi
http://192.168.1.100:30896  # Jellyfin
http://192.168.1.100:30453  # Navidrome
http://192.168.1.100:30500  # Kavita
http://192.168.1.100:30283  # Immich
```

**Performance comparison:**

- NodePort (home): ~2ms latency, full gigabit bandwidth
- Tailscale (home): ~5-10ms latency (Tailscale detects LAN peers)
- Tailscale (remote): ~30-50ms latency, WAN limited

**The beauty:** Both work simultaneously. Jellyfin app has two server URLs configured—it automatically uses NodePort at home and Tailscale when away.

### 2. Namespace Design: 5-Layer Architecture

I organized services into logical layers:

```
00-foundation/          # Namespaces, Tailscale Subnet Router
01-infrastructure/      # Prometheus, Grafana, Node Exporter, Kite Dashboard
02-middleware/          # PostgreSQL, MariaDB, Valkey (shared databases)
03-core/               # Vaultwarden, Immich, Readeck, Lychee, CouchDB, Harus Blog
04-media/              # Jellyfin, Navidrome, Kavita, File Browser
05-tools/              # N8N, Harus Bot
```

**Why this matters:**

Cross-namespace communication uses FQDNs:

```yaml
env:
  - name: DB_HOSTNAME
    value: "postgres.harus-middleware.svc.cluster.local"
  - name: DB_PORT
    value: "5432"
```

**Critical gotcha:** Secrets don't propagate across namespaces. If a service in `harus-core` needs PostgreSQL credentials, you must create the secret in `harus-core`:

```bash
make secret ENV=postgres.env NAME=postgres-secret NS=harus-core
```

### 3. Secrets Management: Make it Simple

I tried **Bitnami Sealed Secrets** initially. It's great for GitOps teams, but added unnecessary complexity for a single-user cluster.

**The pivot:** I stripped it out and used a `Makefile` wrapper around native Kubernetes Secrets.

**Current workflow:**

1. Keep `.env` files locally (gitignored):

   ```bash
   # postgres.env
   POSTGRES_PASSWORD=super-secret-password
   POSTGRES_USER=postgres
   ```

2. Generate secrets via make:

   ```bash
   make secret ENV=postgres.env NAME=postgres-secret NS=harus-middleware
   ```

3. Reference in manifests:

   ```yaml
   env:
     - name: POSTGRES_PASSWORD
       valueFrom:
         secretKeyRef:
           name: postgres-secret
           key: POSTGRES_PASSWORD
   ```

**Why it works:**

- Native Kubernetes primitives (no custom controllers)
- Simple to understand and debug
- Lost the secret? Regenerate from `.env` file
- No master key to lose (Sealed Secrets problem)

### 4. Storage Strategy: Simple but Safe

I avoided distributed storage (Ceph, Longhorn) and stuck with K3s's default `local-path-provisioner`.

**Three storage types:**

1. **Critical data (PersistentVolume + hostPath):**

   ```yaml
   # /mnt/harus_data/vaultwarden - survives pod restarts
   hostPath:
     path: /mnt/harus_data/vaultwarden
     type: DirectoryOrCreate
   ```

2. **Ephemeral/cache (local-path StorageClass):**

   ```yaml
   # Auto-provisioned at /var/lib/rancher/k3s/storage/pvc-{UUID}
   storageClassName: local-path
   ```

3. **Read-only media (hostPath ReadOnly):**

   ```yaml
   # Large media libraries (movies, music, books)
   hostPath:
     path: /mnt/harus_storage/media
     type: Directory
   ```

**Default storage location:**

```bash
/var/lib/rancher/k3s/storage/pvc-abc123_harus-core_grafana-pvc/
```

### 5. Backup Strategy: 3-Layer Defense

This is where Kubernetes really shines compared to Docker Compose.

#### Layer 1: K3s Cluster State (NEW!)

K3s has built-in etcd snapshot capabilities:

```bash
# Automated every 6 hours
--etcd-snapshot-schedule-cron "0 */6 * * *"
--etcd-snapshot-retention 10
```

**What it backs up:**

- All Kubernetes resources (Deployments, Services, ConfigMaps, **Secrets**)
- RBAC configurations
- PVC metadata (not the data itself)

**Why it matters:** If the machine dies, I can restore the entire cluster state in ~2 minutes instead of manually reapplying 100+ YAML files.

**Automated upload to R2:**

```bash
# systemd timer uploads snapshots to Cloudflare R2
rclone copy /var/lib/rancher/k3s/server/db/snapshots/ \
  cloudflare-r2:harus-backup/k3s-snapshots/
```

**Storage cost:** ~1GB, ~$0.02/month

#### Layer 2: Application Data (Files)

`hako` CronJob backs up critical PVCs:

```yaml
# Daily at 2:00 AM
schedule: "0 2 * * *"
# Backs up: Vaultwarden, Immich photos, CouchDB, etc.
```

**Storage cost:** ~100GB, ~$1.50/month

#### Layer 3: Database Dumps (Consistency)

CronJobs run database dumps for point-in-time recovery:

```yaml
# PostgreSQL dump (daily 1:30 AM)
pg_dumpall -U postgres | gzip > /backup/postgres-$(date +%Y%m%d).sql.gz

# MariaDB dump
mysqldump --all-databases | gzip > /backup/mariadb-$(date +%Y%m%d).sql.gz
```

**Why separate from Layer 2:** Database files might be inconsistent if captured mid-write. SQL dumps guarantee consistency.

**Storage cost:** ~5GB, ~$0.08/month

**Total backup cost:** ~$1.60/month on Cloudflare R2

**Disaster recovery time:** ~45 minutes to 1.5 hours (vs. Docker Compose: "hope you have backups")

### 6. Public Access: Selective with Cloudflare Tunnel

Most services are private (Tailscale-only), but two need public access:

- **Vaultwarden:** Password manager, accessed from browsers without Tailscale
- **CouchDB:** Obsidian sync, accessed from mobile app

**Solution:** Cloudflare Tunnel (formerly Argo Tunnel)

```yaml
# Sidecar deployment
containers:
  - name: cloudflared
    image: cloudflare/cloudflared:latest
    args:
      - tunnel
      - --no-autoupdate
      - --protocol
      - http2 # CRITICAL: Alpine's env doesn't support QUIC
      - run
      - --token
      - $(TUNNEL_TOKEN)
```

**Why Cloudflare Tunnel:**

- Zero open ports (outbound connection only)
- Free tier (no cost)
- Automatic TLS certificates
- DDoS protection

**Configuration gotcha:** Use `--protocol http2` instead of default QUIC. Alpine Linux's BusyBox `env` doesn't support the `-S` flag that QUIC uses, causing cryptic failures.

## The Migration Journey: Lessons Learned

### What Worked Immediately

1. **Prometheus first:** I deployed monitoring BEFORE migrating apps. This let me:
   - Understand baseline resource usage
   - Catch memory leaks early
   - Monitor migration progress

2. **Shared databases:** PostgreSQL and MariaDB in `harus-middleware` namespace
   - Multiple apps share same database instance
   - Saves ~500MB RAM vs. per-app databases

3. **Resource limits everywhere:**

   ```yaml
   resources:
     requests:
       memory: "128Mi"
       cpu: "100m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

   - Prevents one app from OOMing the node
   - Kubernetes scheduler makes better decisions

### What I Got Wrong (And Fixed)

#### Problem 1: Tailscale Operator Latency

**Initial setup:** Tailscale Operator with LoadBalancer services
**Problem:** 20-50ms latency even on home WiFi
**Root cause:** Traffic went through proxy pods instead of direct
**Fix:** Deleted operator, deployed Subnet Router, added NodePort for high-traffic services

**Impact:** Latency dropped from 50ms to 2ms for local streaming

#### Problem 2: ReadWriteMany PVC Failures

**Initial attempt:** Set PVCs to ReadWriteMany (RWX)
**Error message:**

```
failed to provision volume: NodePath only supports ReadWriteOnce
```

**Fix:** Single-node cluster only needs ReadWriteOnce (RWO). Multiple pods on same node can still mount RWO volumes.

#### Problem 3: OG Image Generation Emoji Failures

When building my Obsidian notes static site with Quartz:

**Error:**

```
Failed to emit from plugin `CustomOgImages`: codepoint 31-20e3 not found in map
```

**Root cause:** Quartz's OG image generator couldn't render certain emoji (keycap emoji like 1️⃣)
**Fix:** Disabled OG image plugin via sed in build script:

```bash
sed -i 's/Plugin\.CustomOgImages/\/\/ Plugin.CustomOgImages/g' quartz.config.ts
```

#### Problem 4: Node.js Version Mismatch

**Initial image:** `node:20-alpine`
**Error:** Quartz requires Node 22+
**Additional issue:** Alpine's BusyBox doesn't support `-S` flag
**Fix:** Switched to `node:22-slim` (Debian-based)

**Resource impact:** Increased builder pod from 200m CPU to 1 CPU (for faster builds)

## Real-World Examples

### Example 1: Obsidian Publishing Pipeline

One of my favorite setups is the automated Obsidian notes publishing:

```
CouchDB (Obsidian LiveSync)
    ↓ (continuous sync - livesync-bridge)
PVC (markdown files)
    ↓ (daily build - Quartz static site generator)
PVC (compiled HTML)
    ↓ (always serving - Caddy)
http://notes.harus-core.svc.cluster.local
```

**Components:**

1. **LiveSync Bridge (Deployment):** Continuously syncs notes from CouchDB to PVC
2. **Builder (CronJob):** Daily at 5 AM, compiles markdown to static HTML with Quartz
3. **Caddy (Deployment):** Serves compiled site

**Resources:**

- Bridge: 50m CPU, 128Mi RAM
- Builder: 1 CPU, 2Gi RAM (runs once daily)
- Caddy: 10m CPU, 32Mi RAM

**Total automation:** Write in Obsidian → Sync to CouchDB → Auto-publish to web

### Example 2: Immich Photo Stack

Immich requires multiple components. K3s makes this manageable:

```yaml
# 1. PostgreSQL (dedicated instance)
# 2. Redis (caching)
# 3. Immich Server (main API)
# 4. Immich Machine Learning (face recognition)
```

**In Docker Compose:** 4 separate container definitions, manual networking
**In K3s:** Clean separation with proper service discovery:

```yaml
env:
  - name: DB_HOSTNAME
    value: "immich-postgres.harus-core.svc.cluster.local"
  - name: REDIS_HOSTNAME
    value: "immich-redis.harus-core.svc.cluster.local"
```

**Resource limits ensure fairness:**

- ML container: 2 CPU, 4Gi RAM (intensive but limited)
- Server: 500m CPU, 2Gi RAM
- Total: Guaranteed not to exceed 6Gi RAM

### Example 3: Shared Database Middleware

Instead of per-app databases, I run shared instances:

**PostgreSQL (harus-middleware):**

- Readeck database
- Harus Bot database
- Future apps

**Benefits:**

- Single backup job for all databases
- Reduced RAM usage (~500MB vs. 2GB for 4 separate instances)
- Centralized monitoring

## The Stack: 23 Services, 7 Namespaces

### Foundation (0)

- Tailscale Subnet Router

### Infrastructure (4)

- Prometheus (metrics)
- Grafana (dashboards)
- Node Exporter (system metrics)
- Kite Dashboard (lightweight K8s UI)

### Middleware (3)

- PostgreSQL (shared database)
- MariaDB (legacy apps)
- Valkey (Redis fork, shared cache)

### Core (7)

- Vaultwarden (password manager)
- Immich (photo management)
- Readeck (read-it-later)
- Lychee (photo gallery)
- CouchDB (Obsidian sync)
- Harus Blog (Hugo static site)
- Harus Obsidian (Quartz notes site)

### Media (4)

- Jellyfin (movies/TV)
- Navidrome (music streaming)
- Kavita (ebook/manga reader)
- File Browser (read-only file server)

### Tools (2)

- N8N (workflow automation)
- Harus Bot (custom Rust Discord bot)

**Total:** 28 running pods across 7 namespaces

## Why Bother? Docker Compose vs. K3s

Docker Compose is great, but K3s gave me tangible benefits:

### 1. Zero-Downtime Updates

**Docker Compose:**

```bash
docker-compose down  # Everything stops
docker-compose pull
docker-compose up -d  # Everything starts
```

**K3s:**

```bash
kubectl set image deployment/immich immich=new-version
# Rolling update: new pod starts → health check passes → old pod terminates
# Service never goes down
```

### 2. Resource Guarantees

**Docker Compose:** Hope for the best
**K3s:** Guaranteed allocations

```yaml
# Immich ML won't steal RAM from Jellyfin
resources:
  limits:
    memory: "4Gi"
```

**Real impact:** Jellyfin no longer stutters when Immich runs face recognition

### 3. Unified Networking

**Docker Compose:**

- Port 8096 → Jellyfin
- Port 4533 → Navidrome
- Port 8080 → Grafana
- (23 ports to remember)

**K3s:**

- All services on port 80
- Access via DNS: `service.namespace.svc.cluster.local`
- Tailscale makes it feel like localhost

### 4. Declarative State

**Docker Compose:** YAML files + runtime state divergence
**K3s:** Desired state enforcement

```bash
# K8s constantly reconciles
kubectl get pods  # Shows actual vs. desired
kubectl describe pod  # Shows events and why
```

### 5. Better Observability

**Docker Compose:** `docker stats`, hope for the best
**K3s:** Prometheus metrics for everything

- Per-pod CPU/memory usage
- Network I/O
- Restart counts
- PVC disk usage

**Grafana dashboard shows:**

- Which service is using the most RAM
- When Immich runs ML jobs (CPU spikes)
- Disk space trends

## Performance & Resource Usage

**Cluster overhead:**

- K3s system pods: ~400MB RAM
- Tailscale router: ~100MB RAM
- Monitoring stack: ~1.5GB RAM
- **Total overhead:** ~2GB

**Compared to Docker Compose:**

- Similar RAM for apps
- +2GB for Kubernetes
- But: Better resource limits prevent OOM
- But: Monitoring catches issues early

**Is it worth 2GB?** For 23 services with monitoring, yes.

## Costs

**Hardware:** $300 Mini PC (one-time)
**Electricity:** ~$5/month (60W idle)
**Backups:** $1.60/month (Cloudflare R2)
**Tailscale:** Free (personal use)
**Cloudflare Tunnel:** Free

**Total recurring:** ~$6.60/month

**Compared to cloud:**

- AWS/GCP equivalent: $200-500/month
- Savings: $2,300-5,900/year

## When NOT to Use This Setup

**Stick to Docker Compose if:**

1. **You have < 5 services:** Kubernetes overhead isn't worth it
2. **You don't care about downtime:** `docker-compose restart` is fine
3. **You're learning Docker:** Master one thing at a time
4. **You need multi-arch (ARM + x86):** K3s makes this harder
5. **You want simplicity:** Docker Compose is genuinely simpler

**Consider K3s if:**

1. **You have 10+ services:** Organization and resource management matter
2. **You need zero downtime:** Rolling updates are crucial
3. **You want proper monitoring:** Prometheus integration is seamless
4. **You run stateful apps:** StatefulSets > Docker volumes
5. **You want to learn Kubernetes:** Homelab is the best learning environment

## Future Plans

Services I'm considering adding:

1. **Homepage/Homarr:** Visual dashboard for all services
2. **Uptime Kuma:** Status monitoring with alerts
3. **Paperless-ngx:** Document management with OCR
4. **Gitea:** Self-hosted git server

Why I haven't added them yet:

- Cluster is stable
- Each new service needs testing
- "Boring" means not constantly tinkering

## Conclusion: Boring is Good

This setup is intentionally boring:

- **No service mesh** (Istio/Linkerd) - overkill for single node
- **No custom CNI** (Calico/Cilium) - default flannel works
- **No distributed storage** (Ceph/Longhorn) - local-path is fine
- **No GitOps controller** (Flux/ArgoCD) - manual apply works
- **No fancy ingress** (Traefik/Nginx) - Tailscale + NodePort is enough

**What makes it production-ready:**

- ✅ Automated backups (3 layers)
- ✅ Monitoring (Prometheus/Grafana)
- ✅ Resource limits (no OOM kills)
- ✅ Zero open ports (Tailscale + Cloudflare Tunnel)
- ✅ Disaster recovery tested
- ✅ All manifests in Git
- ✅ Dual-access networking (fast local + secure remote)

**The boring parts are features, not bugs.** My homelab has been running for weeks without intervention. Services auto-restart on failure. Updates are zero-downtime. Backups run automatically.

That's the whole point: **Build it once, let it run.**

## Resources

**My setup (sanitized):**

- GitHub: (link to your repo)
- Architecture docs: `docs/` folder
- Full deployment status: `DEPLOYMENT_STATUS.md`

**Tools used:**

- [K3s](https://k3s.io/) - Lightweight Kubernetes
- [Tailscale](https://tailscale.com/) - Zero-config VPN
- [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) - Secure tunnels
- [Prometheus](https://prometheus.io/) - Metrics & monitoring
- [Grafana](https://grafana.com/) - Dashboards

**Helpful guides:**

- K3s documentation: Excellent for single-node setups
- Tailscale subnet routers: Game-changer for homelab networking
- Kubernetes in Action (book): Best resource for learning K8s concepts

---

**TL;DR:** Migrated 23 services from Docker Compose to K3s. Used Tailscale Subnet Router for zero-config remote access, NodePort for fast local streaming, and a 3-layer backup strategy (cluster state + files + databases). Total cost: $6.60/month. Zero open ports. Zero downtime updates. Boring and reliable.
