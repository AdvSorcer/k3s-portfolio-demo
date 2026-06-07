# Laptop Advise k3s Secrets

The `laptop-advise` Helm chart references existing Kubernetes Secrets. Do not commit real tokens, app keys, or database passwords to this repository.

Create the namespace first:

```bash
kubectl create namespace portfolio --dry-run=client -o yaml | kubectl apply -f -
```

Create the GHCR image pull secret for the private package:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace portfolio \
  --docker-server=ghcr.io \
  --docker-username=advsorcer \
  --docker-password='NEW_GITHUB_TOKEN_HERE' \
  --docker-email='YOUR_EMAIL'
```

Create the Laravel runtime secret:

```bash
kubectl create secret generic laptop-advise-secret \
  --namespace portfolio \
  --from-literal=APP_KEY='base64:YOUR_LARAVEL_APP_KEY' \
  --from-literal=DB_PASSWORD='YOUR_POSTGRES_PASSWORD'
```

The repo only stores the Secret names:

```yaml
imagePullSecrets:
  - name: ghcr-pull-secret

laravel:
  secretName: laptop-advise-secret
```
