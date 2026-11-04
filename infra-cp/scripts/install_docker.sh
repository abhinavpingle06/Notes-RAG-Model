#!/bin/bash

# Print commands, stop on errors, and catch pipeline failures
set -euxo pipefail

# Save all output to a log file
exec > >(tee -a /var/log/docker-install.log) 2>&1

echo "========================================"
echo "Starting Docker Installation"
date
echo "========================================"

echo "Step 1: Removing conflicting packages"

apt-get remove -y \
  docker.io docker-compose docker-compose-v2 \
  docker-doc docker-buildx podman-docker \
  containerd runc || true

echo "Step 2: Updating packages"
apt-get update

echo "Step 3: Installing prerequisites"
apt-get install -y ca-certificates curl

echo "Step 4: Adding Docker GPG key"
install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

chmod a+r /etc/apt/keyrings/docker.asc

echo "Step 5: Adding Docker repository"
. /etc/os-release

echo "Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc" \
  > /etc/apt/sources.list.d/docker.sources

echo "Step 6: Updating package lists"
apt-get update

echo "Step 7: Installing Docker and Compose"
apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

echo "Step 8: Enabling and starting Docker"
systemctl enable --now docker

echo "Step 9: Checking Docker version"
docker --version

echo "Step 10: Checking Docker Compose version"
docker compose version

echo "Step 11: Checking Docker service"
systemctl status docker --no-pager

echo "Step 12: Checking installed Docker components"
docker info
docker buildx version
docker compose version

echo "========================================"
echo "Docker Installation Completed Successfully"
date
echo "========================================"