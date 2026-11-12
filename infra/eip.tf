resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = {
    Name    = "rag-nat-eip"
    Project = "Simple-Docs-RAG"
  }
}
