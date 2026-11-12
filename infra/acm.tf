resource "aws_acm_certificate" "cert" {
  domain_name       = "rag-api.naamjaap.app"
  validation_method = "DNS"
  tags = {
    Name = "RAG-PROJECT-CERT"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "cert_validation_from_cloudflare" {
  certificate_arn = aws_acm_certificate.cert.arn
  validation_record_fqdns = [
    for record in cloudflare_dns_record.frontend_cert : record.name
  ]
}