output "Success" {
  value = "Completed"
}

output "cdn_ip" {
  value = "http://${module.Frontend.cdn_domain_name}"
}

output "cdn_url" {
  value = "https://${module.Frontend.cdn_domain_name}"
}