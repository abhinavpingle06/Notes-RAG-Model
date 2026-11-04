variable "cloudflare_api" {
  type = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "region_acm" {
  type = string
  default = "us-east-1"
}