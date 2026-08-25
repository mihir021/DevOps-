# 🚀 MERN Stack Production Starter Template

A production-grade, modular **MERN Stack Starter Template** equipped with automated CI/CD, Docker multi-stage containerization, Nginx reverse proxy, and optional Prometheus + Grafana observability.

Designed to support **Multi-Project Deployments** — you can host dozens of these projects on the exact same EC2 server without port conflicts!

---

## ✨ Features
- **Frontend:** React 19, Vite, React Router v7.
- **Backend:** Node.js 22, Express 5, Mongoose 9 (MongoDB Atlas).
- **Nginx Reverse Proxy:** Internal routing for `/api/*` requests — no exposed backend port, zero CORS errors.
- **Multi-Stage Docker:** Ultra-slim Alpine images.
- **Observability:** Prometheus & Grafana (toggleable).
- **Automated CI/CD:** Zero-downtime SSH deployment to AWS EC2 via GitHub Actions.
- **Multi-Tenant Ready:** Dynamic port mapping allows multiple projects on a single server.

---

## 🏗️ Architecture Diagrams

### Single Project Architecture
```mermaid
graph TD
    User([User]) -->|HTTP| EC2[EC2 Instance]
    
    subgraph EC2[EC2 Instance / Docker Engine]
        Client[Nginx React Client]
        Server[Express Node.js Server]
        Prometheus[Prometheus]
        Grafana[Grafana]
        
        Client -->|/api/*| Server
        Prometheus -.->|Scrapes /metrics| Server
        Grafana -.->|Reads| Prometheus
    end
    
    Server -->|Mongoose| MongoDB[(MongoDB Atlas)]
```

### Multi-Project Architecture (Same Server)
```mermaid
graph TD
    UserA([User A]) -->|Port 8080| Nginx1[Project-1 Client]
    UserB([User B]) -->|Port 8081| Nginx2[Project-2 Client]
    
    subgraph EC2[Shared EC2 Server]
        subgraph Project 1
            Nginx1 --> Server1[Project-1 Server]
        end
        subgraph Project 2
            Nginx2 --> Server2[Project-2 Server]
        end
    end
```

---

## 🏁 Quickstart

### 1. Create a Repository
1. Click **"Use this template"** → **"Create a new repository"**.
2. Clone your new repository locally:
   `git clone https://github.com/<USERNAME>/<PROJECT_NAME>.git`

### 2. Initialize in 60 Seconds
Run the interactive initializer:
`./init-project.sh`
This sets up your project slug, GitHub username, and feature toggles.

---

## ☁️ Production Deployment (AWS EC2)

This template uses GitHub Actions to automatically deploy to your EC2 instance on every push to `main`. 

> [!WARNING]
> **Important:** Your deployment will **SKIP** if you do not configure all GitHub Secrets correctly. If your "Deploy to EC2" job finishes in exactly 7 seconds with a green checkmark, it means it skipped deployment due to missing secrets!

### Step 1: Add GitHub Secrets
Go to **Settings > Secrets and variables > Actions > Repository secrets** and add exactly these:

| Secret Name | Description | Example |
|---|---|---|
| `EC2_HOST` | Public IPv4 address of your server | `54.166.198.31` |
| `EC2_USER` | SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your private `.pem` SSH key. **See warning below!** | `-----BEGIN RSA PRIVATE KEY-----...` |
| `MONGODB_URI` | MongoDB Atlas URI | `mongodb+srv://user:pass@cluster...` |
| `JWT_SECRET` | Secret string for auth | `super-secret-key-123` |

**Dynamic Port Secrets (Critical for Multi-Project!):**
To prevent port conflicts when hosting multiple projects, you MUST define unique ports for every new project.
| Secret Name | Description | Project 1 Example | Project 2 Example |
|---|---|---|---|
| `CLIENT_PORT` | The public port for your website | `8080` | `8081` |
| `SERVER_PORT` | The backend port (internal only) | `5000` | `5001` |
| `PROMETHEUS_PORT` | Port for Prometheus UI | `9090` | `9091` |
| `GRAFANA_PORT` | Port for Grafana Dashboard | `3000` | `3001` |

> [!CAUTION]
> **Formatting your `EC2_SSH_KEY`:** 
> Copying the `.pem` file incorrectly is the #1 cause of deployment failure (Error: `unable to authenticate`). 
> You MUST copy the entire file including the first and last lines, ensuring the line breaks are preserved exactly. Do not paste it as one long horizontal string.
> ```text
> -----BEGIN RSA PRIVATE KEY-----
> MIIEpAIBAAKCAQEA...
> (many lines of text)
> -----END RSA PRIVATE KEY-----
> ```

### Step 2: Open AWS Security Group Ports
Once your secrets are set and your code is pushed, you must open the `CLIENT_PORT` (and Grafana/Prometheus ports if using them) in AWS.
1. Go to your EC2 instance in AWS.
2. Go to the **Security** tab and click your **Security Group**.
3. Click **Edit inbound rules** -> **Add rule**.
4. Type: **Custom TCP**, Port: **Your CLIENT_PORT (e.g. 8081)**, Source: **Anywhere-IPv4**.
5. Save the rules.

---

## 🛠️ Troubleshooting / Q&A

**Q: My deployment finishes perfectly, but when I visit the IP address, my browser spins forever and says "Connection Timed Out".**
> **A:** Your AWS Firewall is blocking the port! "Connection Timed Out" means the server's firewall dropped your packets. Go to your AWS Security Group and make sure you added an Inbound Rule for your `CLIENT_PORT` (e.g., 8080 or 8081).

**Q: My browser instantly rejects the connection saying "Connection Refused".**
> **A:** "Connection Refused" means your AWS Firewall is OPEN (which is good), but the Docker containers are not running on the server. This usually happens if your GitHub Actions deployment skipped, or if your MongoDB URI is incorrect causing the backend container to crash on startup. Check your GitHub Actions logs!

**Q: My "Deploy to EC2" job took exactly 7 seconds and got a green checkmark, but nothing deployed!**
> **A:** The workflow has a safety check. If it cannot find the `EC2_HOST` secret in your "Repository secrets", it skips the deployment to prevent errors. Go add the `EC2_HOST` secret and try again.

**Q: In my GitHub Actions logs, I see the error: `Bind for 0.0.0.0:80 failed: port is already allocated`.**
> **A:** You are trying to start a project on a port that is already being used by another project (or by Nginx/Apache) on your server. Make sure you set unique `CLIENT_PORT`, `SERVER_PORT`, `PROMETHEUS_PORT`, and `GRAFANA_PORT` GitHub Secrets for this repository.

**Q: In my GitHub Actions logs, I see the error: `ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain`.**
> **A:** GitHub found your `EC2_SSH_KEY`, but the EC2 server rejected it. This almost always means the formatting of the key was lost when you copy-pasted it into GitHub Secrets. Open your `.pem` file in a code editor like VS Code, select all, copy, and paste it again.

---

## 📄 License
ISC © 2026
