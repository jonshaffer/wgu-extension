terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    github = {
      source  = "integrations/github"
      version = ">= 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
}

# GitHub provider - uses GITHUB_TOKEN environment variable
provider "github" {
  owner = var.github_organization_name
}
