resource "cloudflare_pages_project" "RAG_Frontend" {
  account_id = var.cloudflare_acc_id
  name = "rag-app"
  production_branch = "main"
}

resource "cloudflare_pages_domain" "rag_domain" {
  account_id = var.cloudflare_acc_id
  project_name = cloudflare_pages_project.RAG_Frontend.name
  name = "rag-app.naamjaap.app"
}

resource "cloudflare_dns_record" "rag_cname" {
  zone_id = var.cloudflare_zone_id

  name    = "rag-app"
  type    = "CNAME"
  content = cloudflare_pages_project.RAG_Frontend.subdomain

  ttl     = 1
  proxied = true

  depends_on = [
    cloudflare_pages_domain.rag_domain
  ]
}