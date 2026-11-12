output "Success" {
  value = "Completed"
}

# output "cdn_ip" {
#   value = "http://${module.Frontend.cdn_domain_name}"
# }

# output "cdn_url" {
#   value = "https://rag-app.naamjaap.app"
# }

output "alb_dns_name" {
  description = "AWS ALB DNS name"
  value       = aws_lb.RAG_LB.dns_name
}

output "alb_zone_id" {
  description = "AWS ALB hosted zone ID"
  value       = aws_lb.RAG_LB.zone_id
}

output "pages_domain_url" {
  description = "Public pages hostname"
  value       = "https://rag-app.naamjaap.app"
}

output "api_url" {
  description = "Public API hostname"
  value       = "https://rag-api.naamjaap.app"
}

output "alb_arn" {
  value = aws_lb.RAG_LB.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.nginx.arn
}

output "mtls_trust_store_arn" {
  value = aws_lb_trust_store.cloudflare.arn
}
