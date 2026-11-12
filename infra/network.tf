resource "aws_vpc" "rag_backend_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "rag_alb-backend-vpc"
  }
}

resource "aws_subnet" "rag_vpc_alb_public_subnet" {
  vpc_id                  = aws_vpc.rag_backend_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "rag-public-alb-subnet-1"
    Type = "Public"
  }
}
resource "aws_subnet" "rag_vpc_alb_public_subnet_2" {
  vpc_id                  = aws_vpc.rag_backend_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-south-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "rag-public-alb-subnet-2"
    Type = "Public"
  }
}

resource "aws_subnet" "rag_vpc_backend_private_subnet" {
  vpc_id            = aws_vpc.rag_backend_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-south-1a"

  tags = {
    Name = "rag-private-backend-subnet-1"
    Type = "Private"
  }
}
resource "aws_subnet" "rag_vpc_backend_private_subnet_2" {
  vpc_id            = aws_vpc.rag_backend_vpc.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "ap-south-1b"

  tags = {
    Name = "rag-private-backend-subnet-2"
    Type = "Private"
  }
}

resource "aws_internet_gateway" "rag_igw" {
  vpc_id = aws_vpc.rag_backend_vpc.id

  tags = {
    Name = "rag-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.rag_backend_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.rag_igw.id
  }

  tags = {
    Name = "rag-public-rt"
  }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.rag_backend_vpc.id

  tags = {
    Name = "rag-private-rt"
  }
}

resource "aws_route_table_association" "public_assoc_1" {
  subnet_id      = aws_subnet.rag_vpc_alb_public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}
resource "aws_route_table_association" "public_assoc_2" {
  subnet_id      = aws_subnet.rag_vpc_alb_public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_assoc_1" {
  subnet_id      = aws_subnet.rag_vpc_backend_private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}
resource "aws_route_table_association" "private_assoc_2" {
  subnet_id      = aws_subnet.rag_vpc_backend_private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

# NAT GATEWAY

resource "aws_nat_gateway" "rag_nat" {
  allocation_id = aws_eip.nat_eip.id

  subnet_id = aws_subnet.rag_vpc_alb_public_subnet.id

  tags = {
    Name    = "rag-nat-gateway"
    Project = "Simple-Docs-RAG"
  }

  depends_on = [
    aws_internet_gateway.rag_igw
  ]
}

resource "aws_route" "private_nat_route" {
  route_table_id         = aws_route_table.private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.rag_nat.id
}