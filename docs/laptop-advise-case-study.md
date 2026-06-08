# Laptop Advise k3s Case Study

## Goal

`laptop-advise` was already a production Laravel + Vue/Inertia application. The goal was not to merge application code into this repository. The goal was to turn this repository into the infrastructure and GitOps layer that can deploy the app reproducibly to k3s.

## Repository Split

Application repository:

```text
laptop-advise
```

Responsibilities:

- Laravel and Vue source code.
- Tests and application build.
- Docker image build.
- GHCR image publish.
- Immutable image tags using commit SHA.

Infrastructure repository:

```text
k3s-portfolio-demo
```

Responsibilities:

- Helm chart and values.
- Argo CD Application definition.
- Ingress, Service, Deployment, PostgreSQL StatefulSet, and PVC.
- Kubernetes Secret references.
- Operational runbooks and rollback notes.

The connection between both repositories is the container image:

```text
ghcr.io/advsorcer/laptop-advise:d5d037594dc014dbb40f1c36ec277a2a5e028e65
```

## Deployment Flow

```text
Developer pushes application code
  -> GitHub Actions builds and tests laptop-advise
  -> GitHub Actions pushes a private GHCR image
  -> infra repo pins the image SHA tag in Helm values
  -> Argo CD syncs the Helm chart
  -> k3s pulls the private image using ghcr-pull-secret
  -> Traefik routes laptop.panelinker.com to the Laravel service
```

## Kubernetes Resources

The `laptop-advise` Helm chart creates:

- `Deployment` for the Laravel container.
- `Service` from port `80` to container port `8080`.
- `Ingress` for `laptop.panelinker.com`.
- `StatefulSet` for PostgreSQL.
- `PersistentVolumeClaim` for PostgreSQL data.
- Optional Argo CD PreSync migration `Job`.

Secrets are created directly in the cluster and are not committed:

- `ghcr-pull-secret`: private GHCR image pull token.
- `laptop-advise-secret`: Laravel `APP_KEY` and PostgreSQL password.

## Decisions

The app image is private, so the chart references:

```yaml
imagePullSecrets:
  - name: ghcr-pull-secret
```

The image tag is pinned to a commit SHA instead of `latest`. This makes Argo CD diffs, rollbacks, and incident review clearer.

Migration is documented as a manual command and also available as an optional PreSync Job. It is disabled by default because database changes should be explicit in a small production-like demo.

## Validation

The deployment was verified with:

```bash
kubectl get pods,svc,ingress -n portfolio
curl -I http://laptop.panelinker.com/healthz
```

The health endpoint returned `200 OK`, and the homepage was reachable through `http://laptop.panelinker.com`.

## Portfolio Value

This project demonstrates a realistic separation between application delivery and infrastructure management:

- The application repository produces an immutable artifact.
- The infrastructure repository owns desired state.
- Argo CD reconciles the cluster from Git.
- k3s runs a real Laravel + PostgreSQL workload behind Traefik.
