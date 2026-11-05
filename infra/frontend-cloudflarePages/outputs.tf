output "pages_default_domain" {
  value = cloudflare_pages_project.RAG_Frontend.subdomain
}

output "rag_custom_domain" {
  value = cloudflare_pages_domain.rag_domain.name
}