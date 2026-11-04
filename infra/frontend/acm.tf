resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = "rag-app.naamjaap.app"
  validation_method = "DNS"
  tags = {
    Name = "RAG-PROJECT-CERT"
  }
  lifecycle {
    create_before_destroy = true
  }
}