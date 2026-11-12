resource "aws_service_discovery_http_namespace" "rag_internal" {
  name = "internal_backend"
  tags = {
    Name = "internal_backend"
  }
}