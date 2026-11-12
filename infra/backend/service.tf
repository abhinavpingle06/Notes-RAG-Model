resource "aws_ecs_service" "backend_service" {
  name = "rag_express_service"
  cluster = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.backend_service.arn
  desired_count = 2
  launch_type = "FARGATE"

  network_configuration {
    subnets = var.backend_subnet
    security_groups = [ aws_security_group.rag_express.id ]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.express_backend_tg
    container_name = "express"
    container_port = 3000
  }
}

resource "aws_ecs_service" "worker_service" {
  name            = "rag_worker_service"
  cluster         = aws_ecs_cluster.rag_project.id
  task_definition = aws_ecs_task_definition.worker_service.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {
    subnets          =  var.backend_subnet
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
    subnets          = var.backend_subnet
    security_groups  = [aws_security_group.rag_ai.id]
    assign_public_ip = false
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.rag_internal.arn

    service {
      port_name      = "ai-http"
      discovery_name = "ai-service"

      client_alias {
        dns_name = "ai-service"
        port     = 8000
      }
    }
  }
}