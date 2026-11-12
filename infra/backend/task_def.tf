resource "aws_ecs_task_definition" "express_task" {
  family                   = "express_task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn = aws_iam_role.rag_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "express_backend"
      image     = "${var.aws_registry}:backend-latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
          appProtocol   = "http"
        }
      ]
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}

resource "aws_ecs_task_definition" "worker_task" {
  family                   = "worker_task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn = aws_iam_role.rag_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker_backend"
      image     = "${var.aws_registry}:backend-latest"
      essential = true
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}

resource "aws_ecs_task_definition" "ai_task" {
  family                   = "ai_task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 2048
  memory                   = 4096
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn = aws_iam_role.rag_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "ai_backend"
      image     = "${var.aws_registry}:ai-latest"
      essential = true

      portMappings = [
        {
          name = "ai-http"
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
          appProtocol   = "http"
        }
      ]
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}