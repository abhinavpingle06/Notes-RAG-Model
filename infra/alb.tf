resource "aws_security_group" "alb_sg" {
  name   = "rag-alb-sg"
  vpc_id = aws_vpc.rag_backend_vpc.id
  tags = {
    Name = "rag_alb_sg"
  }
}
resource "aws_vpc_security_group_ingress_rule" "rag-alb-inbound-https" {
  for_each = toset(var.cloudflare_ipv4_ranges)

  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = each.value
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}
resource "aws_vpc_security_group_ingress_rule" "rag-alb-inbound-http" {
  for_each = toset(var.cloudflare_ipv4_ranges)

  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = each.value
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}
resource "aws_vpc_security_group_egress_rule" "rag-alb-outbound" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_lb" "RAG_LB" {
  name               = "rag-backend-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups = [
    aws_security_group.alb_sg.id
  ]
  subnets = [
    aws_subnet.rag_vpc_alb_public_subnet.id,
    aws_subnet.rag_vpc_alb_public_subnet_2.id
  ]
  enable_deletion_protection = false
  access_logs {
    bucket  = var.bucket_to_store_logs_alb
    enabled = true
    prefix  = "rag-alb"
  }
  tags = {
    Name    = "rag-backend-alb"
    Project = "Simple-Docs-RAG"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "rag-alb-target-backend"
  vpc_id      = aws_vpc.rag_backend_vpc.id
  port        = "80"
  protocol    = "HTTP"
  target_type = "ip"
}


resource "aws_lb_trust_store" "cloudflare" {
  name                             = "cloudflare-alb-trustStore"
  ca_certificates_bundle_s3_bucket = var.bucket_to_store_logs_alb
  ca_certificates_bundle_s3_key    = var.cert_name
}
