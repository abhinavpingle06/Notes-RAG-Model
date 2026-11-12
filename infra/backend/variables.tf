variable "aws_registry" {
  type = string
}

variable "backend_subnet" {
  type = list(string)
}

variable "nginx_sg" {
  type = string
}

variable "nginx_target_grp" {
  type = string
}

variable "express_backend_tg" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_route_table_ids" {
  type = list(string)
}
