terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.69.1"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_instance" "jenkins" {
    ami = var.jenkins_config.ami
    instance_type = var.jenkins_config.ec2_type
    root_block_device {
      volume_size = var.jenkins_config.volume
      volume_type = var.jenkins_config.volume_type
      delete_on_termination = true

      tags = {
        Name = "Jenkins Volume"
      }
    }
    vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

    user_data = join("\n",[
        file("${path.module}/scripts/install_jenkins.sh"),
        file("${path.module}/scripts/install_docker.sh")
    ]) 

    tags = {
      Name = "Jenkins_Server"
    }
}

resource "aws_instance" "codebase" {
    ami = var.codebase_config.ami
    instance_type = var.codebase_config.ec2_type
    root_block_device {
      volume_size = var.codebase_config.volume
      volume_type = var.codebase_config.volume_type
      delete_on_termination = true

      tags = {
        Name = "Codebase RAG Volume"
      }
    }
    vpc_security_group_ids = [aws_security_group.codebase_sg]

    user_data = file("${path.module}/scripts/install_docker.sh")

    tags = {
      Name = "Codebase-RAG_Server"
    }
}