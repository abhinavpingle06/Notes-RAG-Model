resource "aws_instance" "nginx_app" {
  ami           = "ami-0c7632fb77f35db43"
  instance_type = "t3.nano"
  subnet_id     = aws_subnet.rag_vpc_backend_private_subnet.id
  vpc_security_group_ids = [
    aws_security_group.nginx_sg.id
  ]
  tags = {
    Name = "nginx-app"
  }
}

resource "aws_security_group" "nginx_sg" {
  name        = "nginx-app-sg"
  description = "Allow HTTP traffic from ALB"
  vpc_id      = aws_vpc.rag_backend_vpc.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nginx-app-sg"
  }
}