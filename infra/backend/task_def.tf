resource "aws_ecs_task_definition" "express_task" {
  family                   = "express_task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn = var.task_role_arn

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

      environment = [
        {
          name  = "MACHINE"
          value = "gpu"
        },
        {
          name  = "INFISICAL_IDENTITY_ID"
          value = var.infisical_machine_id
        },
        {
          name  = "INFISICAL_PROJECT_ID"
          value = var.infisical_project_id
        }
      ]

      command = ["npm", "run", "express:prod"]
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
  task_role_arn = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "worker_backend"
      image     = "${var.aws_registry}:backend-latest"
      essential = true
      environment = [
        {
          name  = "MACHINE"
          value = "gpu"
        },
        {
          name  = "INFISICAL_IDENTITY_ID"
          value = var.infisical_machine_id
        },
        {
          name  = "INFISICAL_PROJECT_ID"
          value = var.infisical_project_id
        }
      ]

      command = ["npm", "run", "worker:prod"]
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
  task_role_arn = var.task_role_arn

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
      environment = [
        {
          name  = "MACHINE"
          value = "gpu"
        },
        {
          name  = "INFISICAL_IDENTITY_ID"
          value = var.infisical_machine_id
        },
        {
          name  = "INFISICAL_PROJECT_ID"
          value = var.infisical_project_id
        }
      ]

      command = ["python", "server.py"]
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}

resource "aws_ecs_task_definition" "redis_task" {
  family                   = "redis_task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 512
  memory = 1024

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true

      portMappings = [
        {
          name          = "redis"
          containerPort = 6379
          hostPort      = 6379
          protocol      = "tcp"
          appProtocol   = "http"
        }
      ]

      command = [
        "redis-server",
        "--appendonly", "yes",
        "--save", "60", "1"
      ]
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}