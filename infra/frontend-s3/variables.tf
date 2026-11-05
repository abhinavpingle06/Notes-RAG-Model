variable "bucket_name" {
  type = string
}

variable "frontend_files_path" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
  sensitive = true
}

variable "region_acm" {
  description = "AWS region for ACM certificate"
  type = string
}

variable "cloudflare_acc_id" {
  type = string
}