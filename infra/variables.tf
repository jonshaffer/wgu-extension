variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "github_organization_name" {
  description = "The GitHub organization or username"
  type        = string
}

variable "pool_id" {
  description = "The Workload Identity Pool ID"
  type        = string
  default     = "github-wif-pool"
}

variable "provider_id" {
  description = "The Workload Identity Pool Provider ID"
  type        = string
  default     = "github-provider"
}

variable "service_account_name_prefix" {
  description = "Prefix for service account names"
  type        = string
  default     = "github"
}

variable "enable_required_apis" {
  description = "Whether to enable required GCP APIs"
  type        = bool
  default     = true
}

variable "manage_github_variables" {
  description = "Whether to automatically set GitHub repository variables"
  type        = bool
  default     = true
}

variable "use_github_environments" {
  description = "Whether to use GitHub environment-level variables"
  type        = bool
  default     = false
}

variable "repositories" {
  description = "Map of GitHub repositories with environments and roles"
  type = map(object({
    repo_name                   = string
    repo_id                     = string
    service_account_name_suffix = optional(string)
    environments = map(object({
      branches = list(string)
      roles    = list(string)
    }))
  }))
}
