resource "aws_ecs_service" "backend_service" {
  name = "rag_backend_service"
  cluster = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.backend_service.arn
  desired_count = 2
  launch_type = "FARGATE"

  network_configuration {
    subnets = [ var.backend_subnet ]
    security_groups = [ var.nginx_sg ]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.nginx_target_grp
    container_name = "nginx"
    container_port = "80"
  }
}