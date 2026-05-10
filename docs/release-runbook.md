# Release Runbook

This project uses GitHub Actions for CI and Argo CD for GitOps CD with a manual release gate.

## Release Flow

```text
Developer pushes to main
GitHub Actions builds backend and frontend images
GitHub Actions pushes GHCR images tagged with github.sha
GitHub Actions updates values-production.yaml with github.sha
Argo CD detects OutOfSync
Operator manually syncs in Argo CD
k3s deploys the pinned image tag
```

## Deploy A New Version

Push the application change to `main`:

```bash
git push origin main
```

Wait for the `container` workflow to finish. It should create a follow-up commit similar to:

```text
chore: update production image tags to <short-sha>
```

Confirm the production values now point at the new image tag:

```bash
git pull
git log --oneline -5
grep -n "tag:" infra/helm/k3s-portfolio/values-production.yaml
```

Open Argo CD and confirm `k3s-portfolio` is `Healthy` and `OutOfSync`. Click `Sync` and keep the default sync options.

## Verify

Check Argo CD:

```bash
kubectl get application k3s-portfolio -n argocd
```

Check Kubernetes:

```bash
kubectl get pods,svc,ingress -n portfolio
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-frontend -n portfolio
```

Check the app:

```bash
curl http://YOUR_VM_IP.sslip.io/api/status
```

Open:

```text
http://YOUR_VM_IP.sslip.io
```

## Roll Back With GitOps

Find the previous good `values-production.yaml` commit:

```bash
git log --oneline -- infra/helm/k3s-portfolio/values-production.yaml
```

Revert the bad production tag update:

```bash
git revert <bad-values-commit-sha>
git push origin main
```

Argo CD will detect `OutOfSync`. Sync the application again to deploy the previous pinned image tag.

Verify:

```bash
kubectl get application k3s-portfolio -n argocd
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-frontend -n portfolio
curl http://YOUR_VM_IP.sslip.io/api/status
```

## Emergency Rollback

Prefer GitOps rollback for normal releases because Git remains the source of truth.

Use Kubernetes rollout undo only when production needs immediate recovery and GitOps rollback would take too long:

```bash
kubectl rollout history deploy/k3s-portfolio-backend -n portfolio
kubectl rollout undo deploy/k3s-portfolio-backend -n portfolio
kubectl rollout status deploy/k3s-portfolio-backend -n portfolio
```

After an emergency rollback, update Git to match the recovered state. Otherwise Argo CD will continue to report drift or re-apply the Git state on the next sync.
