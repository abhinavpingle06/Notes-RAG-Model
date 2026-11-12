resource "aws_security_group" "ecr_vpce_sg" {
  name        = "ecr-vpce-sg"
  description = "Allow ECS tasks to access ECR endpoints"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

locals {
  ecs_task_security_groups = {
    express = aws_security_group.rag_express.id
    worker  = aws_security_group.rag_worker.id
    ai      = aws_security_group.rag_ai.id
  }
}

resource "aws_security_group_rule" "ecr_vpce_ingress" {
  for_each = local.ecs_task_security_groups

  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecr_vpce_sg.id
  source_security_group_id = each.value
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.ap-south-1.ecr.api"
  vpc_endpoint_type   = "Interface"

  subnet_ids          = var.backend_subnet
  security_group_ids  = [aws_security_group.ecr_vpce_sg.id]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.ap-south-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"

  subnet_ids          = var.backend_subnet
  security_group_ids  = [aws_security_group.ecr_vpce_sg.id]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.ap-south-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = var.private_route_table_ids
}