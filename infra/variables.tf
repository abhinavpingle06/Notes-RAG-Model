variable "jenkins_config" {
    description = "AMI ID for the Jenkins EC2 instance"
    type = object({
      ec2_type = string
      volume = number
      volume_type = string
      ami = string
    })
}

variable "codebase_config" {
    type = object({
      ec2_type = string
      volume = number
      volume_type = string
      ami = string
    })
}