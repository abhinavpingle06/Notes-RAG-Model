variable "images_list" {
  type = list(string)
}

variable "aws_registry" {
  type = string
}

variable "backend_subnet" {
  type = string
}

variable "nginx_sg" {
  type = string
}

variable "nginx_target_grp" {
  type = string
}
