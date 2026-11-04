resource "github_repository_webhook" "rag_webhook" {
  repository = var.repo_url

  configuration {
    url          = "http://${aws_instance.jenkins.public_ip}:8080/github-webhook/"
    content_type = "json"
    insecure_ssl = false
  }
  events = ["push"]
  active = true
}
