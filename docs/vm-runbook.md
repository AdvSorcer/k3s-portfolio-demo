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
apt-get update
apt-get install -y curl ca-certificates git docker.io
curl -fsSL https://get.k3s.io | sh -
kubectl get nodes
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

## 4. Clone Project

```bash
git clone https://github.com/AdvSorcer/k3s-portfolio-demo.git
cd k3s-portfolio-demo
```

## 5. Build Images

The preferred production-like path is GitHub Actions + GHCR:

```bash
git push origin main
```

Then use:

```text
ghcr.io/YOUR_USER/k3s-portfolio-frontend:<commit-sha>
ghcr.io/YOUR_USER/k3s-portfolio-backend:<commit-sha>
```

The workflow also updates `infra/helm/k3s-portfolio/values-production.yaml` with the built commit SHA after both images are pushed. Argo CD will detect the Git change and wait for a manual sync.

For a fast VM-only demo, build and import local images:

```bash
docker build -t k3s-portfolio-backend:local ./apps/backend
docker build -t k3s-portfolio-frontend:local ./apps/frontend

docker save k3s-portfolio-backend:local -o /tmp/k3s-portfolio-backend.tar
docker save k3s-portfolio-frontend:local -o /tmp/k3s-portfolio-frontend.tar

k3s ctr -n k8s.io images import /tmp/k3s-portfolio-backend.tar
k3s ctr -n k8s.io images import /tmp/k3s-portfolio-frontend.tar
```

## 6. Deploy

Production-like deploy from GHCR:

```bash
helm upgrade --install k3s-portfolio ./infra/helm/k3s-portfolio \
  --namespace portfolio \
  --create-namespace \
  -f infra/helm/k3s-portfolio/values-production.yaml \
  --set app.host=YOUR_VM_IP.sslip.io \
  --set backend.image.tag=YOUR_COMMIT_SHA \
  --set frontend.image.tag=YOUR_COMMIT_SHA
```

Fast VM-only deploy with locally imported images:

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

## 7. Verify

```bash
kubectl get pods,svc,ingress -n portfolio
kubectl describe ingress k3s-portfolio -n portfolio
kubectl logs deploy/k3s-portfolio-backend -n portfolio
curl http://YOUR_VM_IP.sslip.io/api/status
```

## 8. Argo CD Manual GitOps

Install Argo CD into the cluster:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get pods -n argocd -w
```

Access the UI through an SSH tunnel instead of exposing Argo CD publicly:

```bash
ssh -L 8080:127.0.0.1:8080 root@YOUR_VM_IP
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open:

```text
https://localhost:8080
```

Get the initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
```

Apply this repository's Argo CD Application:

```bash
kubectl apply -f infra/argocd/application.yaml
```

In Argo CD, open `k3s-portfolio` and click `Sync`. Keep the default sync options for the first manual sync.

Verify:

```bash
kubectl get application k3s-portfolio -n argocd
kubectl get pods,svc,ingress -n portfolio
curl http://YOUR_VM_IP.sslip.io/api/status
```

## 9. Rollback Demo

After deploying a new image tag:

```bash
kubectl rollout history deploy/k3s-portfolio-backend -n portfolio
kubectl rollout undo deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
```

With GitOps, the preferred rollback is to revert `values-production.yaml` to a previous commit SHA and sync again in Argo CD.

For the full release and rollback procedure, see [release-runbook.md](release-runbook.md).

## 10. Cleanup

```bash
helm uninstall k3s-portfolio -n portfolio
kubectl delete namespace portfolio
```
