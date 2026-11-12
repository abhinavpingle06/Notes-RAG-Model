terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.71.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.9.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.28.1"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api
}

# resource "random_id" "bucket_id" {
#   byte_length = 8
# }

# module "Frontend" {
#   source = "./frontend-s3"
#   providers = {
#     aws           = aws
#     aws.us_east_1 = aws.us_east_1
#     cloudflare    = cloudflare
#   }
#   bucket_name         = "rag-frontend-bucket-${random_id.bucket_id.hex}"
#   frontend_files_path = "../frontend/dist/"
#   cloudflare_zone_id  = var.cloudflare_zone_id
#   region_acm          = var.region_acm
#   cloudflare_acc_id = var.cloudflare_acc_id
# }

module "Frontend" {
  source = "./frontend-cloudflarePages"
  cloudflare_zone_id = var.cloudflare_zone_id
  cloudflare_api = var.cloudflare_api
  cloudflare_acc_id = var.cloudflare_acc_id
  alb_dns_ip = aws_lb.RAG_LB.dns_name
}

module "Backend" {
  source = "./backend"
  aws_registry = aws_ecr_repository.rag_registry.repository_url
  vpc_id = aws_vpc.rag_backend_vpc.id
  backend_subnet = [ aws_subnet.rag_vpc_backend_private_subnet.id , aws_subnet.rag_vpc_backend_private_subnet_2.id ]
  alb_sg = aws_security_group.alb_sg.id
  nginx_sg = aws_security_group.nginx_sg.id
  nginx_target_grp = aws_lb_target_group.nginx.arn
  express_backend_tg = aws_alb_target_group.express_backend.arn
  private_route_table_ids = [ aws_route_table.private_rt.id ]
}