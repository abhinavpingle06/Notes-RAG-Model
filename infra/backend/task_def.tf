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
          name = "express"
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

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ai_backend_logs.name
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "express"
          
        }
      }

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
        },
        {
          name = "REDIS_URL"
          value = "redis://redis:6379"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ai_backend_logs.name
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "worker"
          
        }
      }

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
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "ai_backend"
      image     = "${var.aws_registry}:ai-latest"
      essential = true

      portMappings = [
        {
          name = "ai"
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

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ai_backend_logs.name
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "ai"       
        }
      }

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
      image     = "redis:8.10.3-alpine"
      essential = true

      portMappings = [
        {
          name          = "redis"
          containerPort = 6379
          hostPort      = 6379
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ai_backend_logs.name
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "redis"
          
        }
      }

      command = [
        "redis-server",
        "--bind", "0.0.0.0",
        "--protected-mode", "no",
        "--port", "6379",
        "--appendonly", "yes",
        "--save", "60", "1"
      ]

      healthCheck = {
        command = [
          "CMD",
          "redis-cli",
          "ping"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}