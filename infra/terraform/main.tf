# =============================================================================
# TUKUBI Cloud Infrastructure as Code (Terraform)
# Fortune-100 Architecture: Supabase, Upstash Redis & Vercel
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.14.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0.0"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.4.0"
    }
  }

  backend "s3" {
    bucket         = "tukubi-terraform-state-prod"
    key            = "platform/production.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "tukubi-tf-locks"
  }
}

locals {
  common_tags = {
    Project     = "TUKUBI"
    Environment = var.environment
    ManagedBy   = "Terraform"
    RegionScope = "Caribbean Basin & Global Diaspora"
  }
}
