resource "aws_ecs_service" "backend_service" {
  name            = "rag_express_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.express_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_execute_command = true

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

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.rag_internal.arn

    service {
      port_name      = "express"
      discovery_name = "express"

      client_alias {
        dns_name = "express"
        port     = 3000
      }
    }
  }

  depends_on = [
    aws_service_discovery_http_namespace.rag_internal,
    aws_ecs_service.ai_service,
    aws_ecs_service.redis_service,
  ]
}

resource "aws_ecs_service" "worker_service" {
  name            = "rag_worker_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.worker_task.arn

  desired_count = 1
  launch_type   = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets          = var.worker_subnet
    security_groups  = [aws_security_group.rag_worker.id]
    assign_public_ip = false
  }

  service_connect_configuration {
  enabled   = true
  namespace = aws_service_discovery_http_namespace.rag_internal.arn
  }

  depends_on = [
  aws_service_discovery_http_namespace.rag_internal,
  aws_ecs_service.ai_service,
  aws_ecs_service.redis_service,
  aws_ecs_service.backend_service
  ]
}

resource "aws_ecs_service" "ai_service" {
  name            = "rag_ai_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.ai_task.arn

  desired_count = 2
  launch_type   = "FARGATE"

  network_configuration {
    subnets          = var.ai_subnet
    security_groups  = [aws_security_group.rag_ai.id]
    assign_public_ip = false
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.rag_internal.arn

    service {
      port_name      = "ai"
      discovery_name = "ai"

      client_alias {
        dns_name = "ai"
        port     = 8000
      }
    }
  }

  depends_on = [
    aws_service_discovery_http_namespace.rag_internal,
    aws_ecs_service.redis_service
  ]
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

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.rag_internal.arn

    service {
      port_name      = "redis"
      discovery_name = "redis"

      client_alias {
        dns_name = "redis"
        port     = 6379
      }
    }
  }

  depends_on = [
    aws_service_discovery_http_namespace.rag_internal
  ]
}
