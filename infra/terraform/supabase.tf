# =============================================================================
# Supabase Production Database Infrastructure
# =============================================================================

resource "supabase_project" "tukubi" {
  organization_id   = var.supabase_org_id
  name              = "tukubi-${var.environment}"
  region            = var.region
  database_password = "CHANGE_IN_VAULT_REPLACE_WITH_SECRET"

  lifecycle {
    prevent_destroy = true
  }
}

resource "supabase_settings" "production_db" {
  project_ref = supabase_project.tukubi.id

  api = {
    db_schema            = "public"
    db_extra_search_path = "public, extensions"
    max_rows             = 1000
  }

  auth = {
    enable_signup = true
    site_url      = "https://tukubi.caribbean"
    jwt_expiry    = 3600
  }
}
