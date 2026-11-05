resource "cloudflare_pages_project" "RAG_Frontend" {
  account_id = var.cloudflare_acc_id
  name = "RAG-app"
  production_branch = "main"
}