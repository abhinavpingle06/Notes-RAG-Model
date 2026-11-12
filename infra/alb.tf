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

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.RAG_LB.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.cert_validation_from_cloudflare.certificate_arn

  mutual_authentication {
    mode            = "verify"
    trust_store_arn = aws_lb_trust_store.cloudflare.arn
  }
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.express_backend.arn
  }
}

resource "aws_lb_target_group" "nginx" {
  name        = "nginx"
  vpc_id      = aws_vpc.rag_backend_vpc.id
  port        = "80"
  protocol    = "HTTP"
  target_type = "ip"
}

resource "aws_lb_target_group" "express_backend" {
  name        = "rag-alb-target-backend"
  vpc_id      = aws_vpc.rag_backend_vpc.id
  port        = "3000"
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-399"
  }
}

resource "aws_lb_trust_store" "cloudflare" {
  name                             = "cloudflare-alb-trustStore"
  ca_certificates_bundle_s3_bucket = var.bucket_to_store_logs_alb
  ca_certificates_bundle_s3_key    = var.cert_name
}
