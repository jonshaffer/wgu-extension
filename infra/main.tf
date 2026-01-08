# WGU Extension - Workload Identity Federation Infrastructure
#
# This configuration sets up secure GitHub Actions -> GCP authentication
# without service account keys using Workload Identity Federation.
#
# Usage:
#   1. Copy terraform.tfvars.example to terraform.tfvars
#   2. Fill in your values
#   3. Run: tofu init && tofu apply

module "github_wif" {
  source = "github.com/hyperfluid-solutions/github-gcp-wif?ref=9f6b1a359c1178a91a6efcefbfb9b208d2b7a453"

  project_id               = var.project_id
  github_organization_name = var.github_organization_name
  pool_id                  = var.pool_id
  provider_id              = var.provider_id
  service_account_name_prefix = var.service_account_name_prefix
  enable_required_apis     = var.enable_required_apis
  manage_github_variables  = var.manage_github_variables
  use_github_environments  = var.use_github_environments

  repositories = var.repositories
}
