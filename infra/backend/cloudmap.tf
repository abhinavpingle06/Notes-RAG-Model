resource "aws_service_discovery_private_dns_namespace" "rag_internal" {
  name = "internal"
  vpc = var.vpc_id
}

resource "aws_service_discovery_service" "express" {
  name = "express"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.rag_internal.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
}

resource "aws_service_discovery_service" "ai" {
  name = "ai"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.rag_internal.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
}

resource "aws_service_discovery_service" "redis" {
  name = "redis"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.rag_internal.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
}