variable "environment" {
  type        = string
  description = "Target deployment environment (production, staging, preview)"
  default     = "production"
}

variable "region" {
  type        = string
  description = "Primary cloud provider deployment region"
  default     = "us-east-1"
}

variable "supabase_org_id" {
  type        = string
  description = "Supabase Organization identifier"
  default     = "org_tukubi_production"
}

variable "database_tier" {
  type        = string
  description = "Supabase compute add-on tier (e.g. 4xlarge for high scale)"
  default     = "4xlarge"
}

variable "upstash_region" {
  type        = string
  description = "Upstash Redis cluster replication zone"
  default     = "us-east-1"
}

variable "vercel_project_names" {
  type        = list(string)
  description = "Monorepo applications deployed to Vercel"
  default     = ["tukubi-web", "tukubi-creator-studio", "tukubi-business-studio", "tukubi-admin"]
}
