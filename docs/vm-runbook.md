# Single-Node k3s VM Runbook

## 1. Create VM

Recommended:

- Ubuntu 24.04 LTS
- 2 vCPU / 4 GB RAM
- 40 GB disk or larger

Open inbound ports:

- `22/tcp` from your IP
- `80/tcp` from anywhere
- `443/tcp` from anywhere
- `6443/tcp` from your IP only, if you need remote kubectl

## 2. Point Hostname

Fast path without buying a domain:

```text
YOUR_VM_IP.sslip.io
```

Example:

```text
1.2.3.4.sslip.io
```

## 3. Install k3s And Helm

```bash
git clone https://github.com/YOUR_USER/k3s-portfolio-demo.git
cd k3s-portfolio-demo
sudo bash infra/scripts/install-k3s.sh
```

## 4. Build Images

The preferred production-like path is GitHub Actions + GHCR:

```bash
git push origin main
```

Then use:

```text
ghcr.io/YOUR_USER/k3s-portfolio-frontend:latest
ghcr.io/YOUR_USER/k3s-portfolio-backend:latest
```

## 5. Deploy

```bash
bash infra/scripts/deploy.sh \
  YOUR_VM_IP.sslip.io \
  ghcr.io/YOUR_USER/k3s-portfolio-frontend:latest \
  ghcr.io/YOUR_USER/k3s-portfolio-backend:latest
```

## 6. Verify

```bash
kubectl get pods,svc,ingress -n portfolio
kubectl describe ingress k3s-portfolio -n portfolio
kubectl logs deploy/k3s-portfolio-backend -n portfolio
curl http://YOUR_VM_IP.sslip.io/api/status
```

## 7. Rollback Demo

After deploying a new image tag:

```bash
kubectl rollout history deploy/k3s-portfolio-backend -n portfolio
kubectl rollout undo deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
```

## 8. Cleanup

```bash
helm uninstall k3s-portfolio -n portfolio
kubectl delete namespace portfolio
```

