resource "aws_security_group" "rag_express" {
  name   = "rag-express-sg"
  vpc_id = var.vpc_id
  tags = {
    Name = "rag_express_sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "rag_express-alb" {

  security_group_id = aws_security_group.rag_express.id
  referenced_security_group_id = var.alb_sg
  from_port         = 3000
  ip_protocol       = "tcp"
  to_port           = 3000
}
resource "aws_vpc_security_group_ingress_rule" "rag_express-ai" {

  security_group_id = aws_security_group.rag_express.id
  referenced_security_group_id = aws_security_group.rag_ai.id
  from_port         = 3000
  ip_protocol       = "tcp"
  to_port           = 3000
}

resource "aws_vpc_security_group_egress_rule" "rag_express-outbound" {
  security_group_id = aws_security_group.rag_express.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "rag_worker" {
  name   = "rag-worker-sg"
  vpc_id = var.vpc_id
  tags = {
    Name = "rag_worker_sg"
  }
}

resource "aws_vpc_security_group_egress_rule" "rag_worker-outbound" {
  security_group_id = aws_security_group.rag_worker.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "rag_ai" {
  name   = "rag-ai-sg"
  vpc_id = var.vpc_id
  tags = {
    Name = "rag_ai_sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "rag_ai-express" {

  security_group_id = aws_security_group.rag_ai.id
  referenced_security_group_id = aws_security_group.rag_express.id
  from_port         = 8000
  ip_protocol       = "tcp"
  to_port           = 8000
}
resource "aws_vpc_security_group_ingress_rule" "rag_ai-worker" {

  security_group_id = aws_security_group.rag_ai.id
  referenced_security_group_id = aws_security_group.rag_worker.id
  from_port         = 8000
  ip_protocol       = "tcp"
  to_port           = 8000
}

resource "aws_vpc_security_group_egress_rule" "ai-outbound" {
  security_group_id = aws_security_group.rag_ai.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "redis" {
  name   = "rag-redis-sg"
  vpc_id = var.vpc_id
  tags = {
    Name = "rag_redis_sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "redis-express" {

  security_group_id = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.rag_express.id
  from_port         = 6379
  ip_protocol       = "tcp"
  to_port           = 6379
}
resource "aws_vpc_security_group_ingress_rule" "redis-worker" {

  security_group_id = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.rag_worker.id
  from_port         = 6379
  ip_protocol       = "tcp"
  to_port           = 6379
}
resource "aws_vpc_security_group_ingress_rule" "redis-ai" {

  security_group_id = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.rag_ai.id
  from_port         = 6379
  ip_protocol       = "tcp"
  to_port           = 6379
}

resource "aws_vpc_security_group_egress_rule" "redis-outbound" {
  security_group_id = aws_security_group.redis.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}



