variable "cloudflare_acc_id" {
  type = string
}

variable "cloudflare_api" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}