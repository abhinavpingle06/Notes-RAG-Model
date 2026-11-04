locals {
  files_array = fileset(var.frontend_files_path, "**")
}

resource "aws_s3_bucket" "RAG_Frontend_S3" {
  bucket = var.bucket_name

  tags = {
    Name = var.bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.RAG_Frontend_S3.id
}

# resource "aws_s3_bucket_policy" "bucket_policy" {
#   bucket = aws_s3_bucket.RAG_Frontend_S3.id
#   policy = jsonencode({
#     Version = "2012-10-17"

#     Statement = [
#       {
#         Sid    = "AllowCloudFrontReadOnly"
#         Effect = "Allow"

#         Principal = {
#           Service = "cloudfront.amazonaws.com"
#         }

#         Action   = "s3:GetObject"
#         Resource = "${aws_s3_bucket.RAG_Frontend_S3.arn}/*"
#       },
      
    #   {
    #     Sid       = "PublicReadGetObject"
    #     Effect    = "Allow"
    #     Principal = "*"
    #     Action    = "s3:GetObject"
    #     Resource  = "${aws_s3_bucket.RAG_Frontend_S3.arn}/*"
    #   }
    
#     ]
#   })
# }

resource "aws_s3_object" "RAG_frontend_files" {
  for_each = local.files_array

  bucket = aws_s3_bucket.RAG_Frontend_S3.id
  key    = each.value
  source = "${var.frontend_files_path}/${each.value}"

  content_type = (endswith(each.value, ".html") ? "text/html" :
    endswith(each.value, ".css") ? "text/css" :
    endswith(each.value, ".js") ? "application/javascript" :
    endswith(each.value, ".png") ? "image/png" :
  "application/octet-stream")

  etag = filemd5("${var.frontend_files_path}/${each.value}")
}
