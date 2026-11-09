resource "aws_ecs_cluster" "rag_project" {
  name = "rag_project"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = {
    Name = "rag_app_cluster"
  }
}