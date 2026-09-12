output "environment" {
  value       = var.environment
  description = "Active deployment tier"
}

output "web_production_domain" {
  value       = "https://tukubi.caribbean"
  description = "Primary canonical Web domain"
}

output "creator_studio_domain" {
  value       = "https://creator.tukubi.caribbean"
  description = "Creator Studio portal domain"
}

output "business_studio_domain" {
  value       = "https://business.tukubi.caribbean"
  description = "Business Studio merchant domain"
}

output "upstash_redis_endpoint" {
  value       = "https://tukubi-redis-prod.upstash.io"
  description = "Distributed Redis REST endpoint for queues and rate-limiting"
}
