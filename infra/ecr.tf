resource "aws_ecr_repository" "rag_registry" {
  name = "rag_codebase"
  image_scanning_configuration {
    scan_on_push = true
  }
  image_tag_mutability = "MUTABLE"
  force_delete = true
}

resource "terraform_data" "github_trigger" {
  triggers_replace = [ aws_ecr_repository.rag_registry.repository_url ]
  provisioner "local-exec" {
    interpreter = ["PowerShell", "-NoProfile", "-Command"]
    command = <<-ST
  $headers = @{
    Accept = "application/vnd.github+json"
    Authorization = "Bearer $env:GITHUB_TOKEN"
    "X-GitHub-Api-Version" = "2022-11-28"
  }

  $body = @{
    event_type = "ecr-ready"
  } | ConvertTo-Json -Compress

  Invoke-RestMethod `
    -Uri "https://api.github.com/repos/abhinavpingle06/Notes-RAG-Model/dispatches" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
ST

    environment = {
      GITHUB_TOKEN = var.GITHUB_TOKEN
    }
  }
  
}