resource "aws_ecs_service" "backend_service" {
  name            = "rag_express_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.express_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.backend_subnet
    security_groups  = [aws_security_group.rag_express.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.express_backend_tg
    container_name   = "express_backend"
    container_port   = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.express.arn
  }
}

resource "aws_ecs_service" "worker_service" {
  name            = "rag_worker_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.worker_task.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = var.worker_subnet
    security_groups  = [aws_security_group.rag_worker.id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "ai_service" {
  name            = "rag_ai_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.ai_task.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = var.ai_subnet
    security_groups  = [aws_security_group.rag_ai.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.ai.arn
  }
}

resource "aws_ecs_service" "redis_service" {
  name            = "rag_redis_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.redis_task.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = var.redis_subnet
    security_groups  = [aws_security_group.redis.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
  }
}
