variable "cloudflare_api" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "region_acm" {
  type    = string
  default = "us-east-1"
}

variable "cloudflare_acc_id" {
  type = string
}

variable "bucket_to_store_logs_alb" {
  type = string
}

variable "cert_name" {
  type = string
}

variable "cloudflare_ipv4_ranges" {
  default = [
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "108.162.192.0/18",
    "131.0.72.0/22",
    "141.101.64.0/18",
    "162.158.0.0/15",
    "172.64.0.0/13",
    "173.245.48.0/20",
    "188.114.96.0/20",
    "190.93.240.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17"
  ]
}

variable "acm_validation_domains" {
  type = set(string)

  default = [
    "rag-api.naamjaap.app"
  ]
}

variable "GITHUB_TOKEN" {
  type      = string
  sensitive = true
}