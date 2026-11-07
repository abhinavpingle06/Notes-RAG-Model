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