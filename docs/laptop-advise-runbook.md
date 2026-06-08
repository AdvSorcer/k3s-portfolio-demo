# Laptop Advise Runbook

This runbook covers the k3s deployment for the private `laptop-advise` Laravel application.

## Prerequisites

The `portfolio` namespace must contain these Secrets:

```bash
kubectl get secret ghcr-pull-secret -n portfolio
kubectl get secret laptop-advise-secret -n portfolio
```

`ghcr-pull-secret` lets k3s pull the private GHCR image. `laptop-advise-secret` provides `APP_KEY` and `DB_PASSWORD`.

## Deploy

The first Application creation is manual unless app-of-apps is added later:

```bash
kubectl apply -f infra/argocd/laptop-advise-application.yaml
```

After that, deploy through Argo CD by syncing the `laptop-advise` Application.

## Verify

Check Kubernetes resources:

```bash
kubectl get pods,svc,ingress -n portfolio
```

Check the health endpoint:

```bash
curl -I http://laptop.panelinker.com/healthz
```

Check the homepage with a browser user agent because the app blocks command-line crawlers:

```bash
curl -I \
  -H 'User-Agent: Mozilla/5.0' \
  http://laptop.panelinker.com
```

## Migrations

For manual migration, run:

```bash
kubectl exec -n portfolio deploy/laptop-advise -- php artisan migrate --force
```

For seed data:

```bash
kubectl exec -n portfolio deploy/laptop-advise -- php artisan db:seed --force
```

The Helm chart also includes an optional Argo CD PreSync migration Job. It is disabled by default:

```yaml
migration:
  enabled: false
```

To run migrations automatically before an Argo CD sync, set:

```yaml
migration:
  enabled: true
```

Keep it disabled unless the migration behavior has been reviewed. Manual migration is easier to reason about for a small portfolio deployment.

## Debug

View recent app logs:

```bash
kubectl logs -n portfolio deploy/laptop-advise --tail=120
```

Common issues:

- `ImagePullBackOff`: check `ghcr-pull-secret` and GHCR token permissions.
- `CreateContainerConfigError`: check `laptop-advise-secret` has `APP_KEY` and `DB_PASSWORD`.
- `relation "sessions" does not exist`: run `php artisan migrate --force`.
- `curl` returns `403`: the app blocks `curl` user agents; test with a browser or browser user agent.

## Rollback

The production image is pinned by commit SHA:

```yaml
image:
  repository: ghcr.io/advsorcer/laptop-advise
  tag: d5d037594dc014dbb40f1c36ec277a2a5e028e65
```

To roll back, change `image.tag` in `infra/helm/laptop-advise/values.yaml` to a previous known-good commit SHA and sync the Argo CD Application.
