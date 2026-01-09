output "workload_identity_pool_id" {
  description = "The Workload Identity Pool ID"
  value       = module.github_wif.workload_identity_pool_id
}

output "workload_identity_provider_id" {
  description = "The Workload Identity Provider ID"
  value       = module.github_wif.workload_identity_provider_id
}

output "service_accounts" {
  description = "Map of created service accounts"
  value       = module.github_wif.service_accounts
}

output "github_actions_config" {
  description = "Configuration values for GitHub Actions"
  value       = module.github_wif.github_actions_config
}

output "project_number" {
  description = "The GCP project number"
  value       = module.github_wif.project_number
}
