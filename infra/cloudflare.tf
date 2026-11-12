resource "cloudflare_dns_record" "rag_api_cname" {
  zone_id = var.cloudflare_zone_id

  name    = "rag-api"
  type    = "CNAME"
  content = aws_lb.RAG_LB.dns_name
  ttl     = 1
  proxied = true
}

# Validation dns
resource "cloudflare_dns_record" "frontend_cert" {
  for_each = toset(["rag-api.naamjaap.app"])

  zone_id = var.cloudflare_zone_id

  name = one([
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.resource_record_name
    if dvo.domain_name == each.key
  ])

  type = one([
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.resource_record_type
    if dvo.domain_name == each.key
  ])

  content = one([
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.resource_record_value
    if dvo.domain_name == each.key
  ])

  ttl     = 3600
  proxied = false
}