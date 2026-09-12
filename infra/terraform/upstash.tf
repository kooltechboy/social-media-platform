# =============================================================================
# Upstash Distributed Redis Infrastructure (Caching & Job Queues)
# =============================================================================

resource "upstash_redis_database" "cache_and_jobs" {
  database_name = "tukubi-${var.environment}-redis"
  region        = var.upstash_region
  tls           = true
  multizone     = true

  lifecycle {
    prevent_destroy = true
  }
}
