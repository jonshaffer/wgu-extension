# WGU Extension Infrastructure

This directory contains OpenTofu/Terraform configuration for setting up secure GitHub Actions to GCP authentication using Workload Identity Federation (WIF).

## What is Workload Identity Federation?

WIF allows GitHub Actions to authenticate to GCP without using service account keys. Instead, it uses short-lived tokens that are automatically managed, providing:

- **Enhanced Security**: No static credentials to leak or rotate
- **Fine-grained Access**: Control which branches/environments can deploy
- **Simplified CI/CD**: No secrets management for GCP access

## Prerequisites

1. **GCP Account** with a project and billing enabled
2. **gcloud CLI** authenticated: `gcloud auth login && gcloud auth application-default login`
3. **OpenTofu** or **Terraform** installed
4. **GitHub Token** with `repo` scope (for managing variables)

## Setup

1. **Copy the example config:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values (already pre-filled for wgu-extension)

3. **Set GitHub token:**
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

4. **Initialize and apply:**
   ```bash
   tofu init
   tofu plan
   tofu apply
   ```

## What Gets Created

### GCP Resources
- Workload Identity Pool (`github-wif-pool`)
- Workload Identity Provider (`github-provider`)
- Service Account (`github-wgu-extension-production-deploy`)
- IAM bindings for Firebase Admin access

### GitHub Variables (automatic)
- `GCP_WL_PROVIDER_ID` - Workload Identity Provider full name
- `GCP_PROJECT_ID` - GCP project ID
- `GCP_PROJECT_NUMBER` - GCP project number
- `GCP_WL_SA_EMAIL_PRODUCTION` - Service account email for production

## Using in GitHub Actions

After applying, update your workflow to use WIF:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Required for WIF
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WL_PROVIDER_ID }}
          service_account: ${{ vars.GCP_WL_SA_EMAIL_PRODUCTION }}
          project_id: ${{ vars.GCP_PROJECT_ID }}

      - name: Deploy to Firebase
        run: npx firebase-tools deploy --project ${{ vars.GCP_PROJECT_ID }}
```

## Role Patterns

The module supports predefined role patterns for common use cases:

| Pattern | Description |
|---------|-------------|
| `firebase_admin` | Full Firebase access (deploy, Firestore, Storage, Hosting) |
| `firebase_deploy` | Deploy-only access |
| `cloud_run_deploy` | Cloud Run deployment |
| `storage_admin` | Cloud Storage management |

See the [WIF module documentation](https://github.com/hyperfluid-solutions/github-gcp-wif) for the full list.

## Cleanup

To remove all created resources:

```bash
tofu destroy
```

## Troubleshooting

### "Permission denied" errors
Ensure your gcloud CLI is authenticated and has Owner/Editor role on the project.

### GitHub variables not created
Check that `GITHUB_TOKEN` is set and has `repo` scope.

### WIF authentication fails in Actions
Verify the workflow has `permissions: id-token: write` set.
