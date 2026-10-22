
resource "aws_iam_role" "jenkins_role" {
  name = "jenkis_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    tag-key = "jenkins-role"
  }
}

resource "aws_iam_policy" "jenkins_ecr_access" {
  name        = "JenkinsECRAccessPolicy"
  description = "Allow Jenkins to push and pull ECR images"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid      = "GetAuthorizationToken"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid = "ManageRepositoryContents"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = aws_ecr_repository.rag_codebase.arn
      }
    ]
  })

  tags = {
    Name = "Jenkins_Policy"
  }
}

resource "aws_iam_role_policy_attachment" "jenkins_policy_attach" {
    policy_arn = aws_iam_policy.jenkins_ecr_access.arn
    role = aws_iam_role.jenkins_role.name
}

resource "aws_iam_instance_profile" "jenkins_profile" {
    name = "Jenkins_profile"
    role = aws_iam_role.jenkins_role.name
}
