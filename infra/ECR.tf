resource "aws_ecr_repository" "rag_codebase" {
  name = "rag_codebase"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "rag_codebase_images"
  }
}