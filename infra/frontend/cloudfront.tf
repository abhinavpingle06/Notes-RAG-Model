# Whats the next origin
resource "aws_cloudfront_origin_access_control" "cloud_front_origin" {
  name                              = "rag-cf-oac"
  origin_access_control_origin_type = "s3"
  signing_protocol                  = "sigv4"
  signing_behavior                  = "always"
}

# Distributer
resource "aws_cloudfront_distribution" "s3_distributor" {
  origin {
    origin_id = aws_s3_bucket.RAG_Frontend_S3.id
    domain_name = aws_s3_bucket.RAG_Frontend_S3.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.cloud_front_origin.id
  }
  enabled = true
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert.arn
    ssl_support_method = "sni-only"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  default_cache_behavior {
    target_origin_id = aws_s3_bucket.RAG_Frontend_S3.id
    allowed_methods = [ "GET", "HEAD" ]
    cached_methods = ["GET","HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }
  aliases = [ "rag-app.naamjaap.app" ]
  default_root_object = "index.html"
}

data "aws_iam_policy_document" "origin_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.RAG_Frontend_S3.arn}/*",
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3_distributor.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "s3_bucket_policy" {
  bucket = aws_s3_bucket.RAG_Frontend_S3.bucket
  policy = data.aws_iam_policy_document.origin_bucket_policy.json
}
