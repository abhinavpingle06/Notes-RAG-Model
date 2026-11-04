# Main frontend
resource "cloudflare_dns_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = "rag-app"
  type    = "CNAME"
  content = aws_cloudfront_distribution.s3_distributor.domain_name
  ttl = 3600
  proxied = false
}
