terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.69.1"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

provider "github" {
  owner = var.github_username
  app_auth {
    id = var.github_app.id
    installation_id = var.github_app.installation_id
    pem_file = file(var.github_app.pem_file)
  }
}


resource "aws_instance" "jenkins" {
    ami = var.jenkins_config.ami
    instance_type = var.jenkins_config.ec2_type
    iam_instance_profile = aws_iam_instance_profile.jenkins_profile.name
    vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

    root_block_device {
      volume_size = var.jenkins_config.volume
      volume_type = var.jenkins_config.volume_type
      delete_on_termination = true

      tags = {
        Name = "Jenkins Volume"
      }
    }

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
    vpc_security_group_ids = [aws_security_group.codebase_sg.id]

    user_data = file("${path.module}/scripts/install_docker.sh")

    tags = {
      Name = "Codebase-RAG_Server"
    }
}