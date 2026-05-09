# k3s Portfolio Demo

一個可以部署到單台雲端 VM 的 Kubernetes/k3s 面試作品骨架。

## Stack

- Frontend: static HTML served by Nginx
- Backend: Node.js + Express
- Database: PostgreSQL with PVC
- Kubernetes: k3s on Ubuntu VM
- Ingress: Traefik, bundled with k3s
- Packaging: Helm

## Local Docker Test

```bash
docker compose up --build
```

Open:

- Frontend container only: http://localhost:8080
- Local edge proxy with `/api` routing: http://localhost:8081
- Backend health: http://localhost:3000/healthz

## VM Requirements

- Ubuntu 22.04 or 24.04
- 2 vCPU / 2 GB RAM minimum
- 2 vCPU / 4 GB RAM recommended
- Public IPv4
- Ports open: `22`, `80`, `443`
- Optional: `6443` restricted to your IP if you need remote `kubectl`

## Clean VPS Quick Start

SSH into the VM:

```bash
ssh root@YOUR_VM_IP
```

Install system tools:

```bash
apt-get update
apt-get install -y curl ca-certificates git docker.io
```

Install k3s:

```bash
curl -fsSL https://get.k3s.io | sh -
kubectl get nodes
```

If `kubectl get nodes` fails, use:

```bash
k3s kubectl get nodes
```

Install Helm:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

Clone this project:

```bash
git clone https://github.com/AdvSorcer/k3s-portfolio-demo.git
cd k3s-portfolio-demo
```

Build images on the VM and import them into k3s:

```bash
docker build -t k3s-portfolio-backend:local ./apps/backend
docker build -t k3s-portfolio-frontend:local ./apps/frontend

docker save k3s-portfolio-backend:local -o /tmp/k3s-portfolio-backend.tar
docker save k3s-portfolio-frontend:local -o /tmp/k3s-portfolio-frontend.tar

k3s ctr -n k8s.io images import /tmp/k3s-portfolio-backend.tar
k3s ctr -n k8s.io images import /tmp/k3s-portfolio-frontend.tar
```

Deploy:

```bash
helm upgrade --install k3s-portfolio ./infra/helm/k3s-portfolio \
  --namespace portfolio \
  --create-namespace \
  --set app.host=YOUR_VM_IP.sslip.io \
  --set backend.image.repository=k3s-portfolio-backend \
  --set backend.image.tag=local \
  --set frontend.image.repository=k3s-portfolio-frontend \
  --set frontend.image.tag=local
```

Open:

```text
http://YOUR_VM_IP.sslip.io
```

## Install k3s On VM

SSH into the VM:

```bash
ssh root@YOUR_VM_IP
```

Install k3s manually:

```bash
curl -fsSL https://get.k3s.io | sudo sh -
sudo k3s kubectl get nodes
```

If you want to use plain `kubectl` instead of `sudo k3s kubectl`, copy the kubeconfig:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$USER:$USER" ~/.kube/config
chmod 600 ~/.kube/config
kubectl get nodes
```

Or use the project bootstrap script:

```bash
sudo bash infra/scripts/install-k3s.sh
```

The script installs k3s and Helm, then prepares kubeconfig for follow-up `kubectl` commands.

## Deploy With Helm

Build and push images first, then update `infra/helm/k3s-portfolio/values.yaml`.

For a quick VM-only test, build images directly on the VM and import them into containerd, or push to GHCR/Docker Hub.

```bash
helm upgrade --install k3s-portfolio ./infra/helm/k3s-portfolio \
  --namespace portfolio \
  --create-namespace \
  --set app.host=YOUR_DOMAIN_OR_VM_IP.sslip.io \
  --set backend.image.repository=ghcr.io/YOUR_USER/k3s-portfolio-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=ghcr.io/YOUR_USER/k3s-portfolio-frontend \
  --set frontend.image.tag=latest
```

If your VM IP is `1.2.3.4`, you can test without buying a domain:

```bash
--set app.host=1.2.3.4.sslip.io
```

## Verify

```bash
kubectl get pods,svc,ingress -n portfolio
kubectl logs deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
```

Open:

```text
http://YOUR_DOMAIN_OR_VM_IP.sslip.io
```

For the full VM flow, see [docs/vm-runbook.md](docs/vm-runbook.md).

## Interview Talking Points

- Images make deployment reproducible compared with git-pull deployment.
- Deployment manages stateless frontend/backend replicas.
- Service gives stable discovery for changing Pod IPs.
- Ingress routes public HTTP traffic to frontend/backend services.
- `/api/*` routes directly to the backend service; `/` routes to the frontend service.
- ConfigMap stores non-sensitive runtime settings.
- Secret stores database credentials.
- StatefulSet + PVC keeps PostgreSQL data persistent.
- Readiness probes prevent traffic before the app is ready.
- Liveness probes restart unhealthy containers.
- Helm values separate environment-specific configuration.
