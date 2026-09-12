# =============================================================================
# Vercel Production Enterprise Deployments
# =============================================================================

resource "vercel_project" "apps" {
  for_each  = toset(var.vercel_project_names)
  name      = each.value
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "kooltechboy/social-media-platform"
  }

  serverless_function_region = "iad1"
}
