output "cdn_domain_name" {
  value = aws_cloudfront_distribution.s3_distributor.domain_name
}