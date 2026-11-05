# Main frontend dns
resource "cloudflare_dns_record" "frontend_app" {
  zone_id = var.cloudflare_zone_id

  name    = "rag-app"
  type    = "CNAME"
  content = aws_cloudfront_distribution.s3_distributor.domain_name

  ttl     = 1
  proxied = false
}

# Validation dns
resource "cloudflare_dns_record" "frontend_cert" {
  for_each = {
    for dns_validation_obj in aws_acm_certificate.cert.domain_validation_options : dns_validation_obj.resource_record_name  => dns_validation_obj
  }
  zone_id = var.cloudflare_zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  content = each.value.resource_record_value
  ttl = 3600
  proxied = false
}
