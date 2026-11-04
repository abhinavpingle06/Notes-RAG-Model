#!/bin/bash

set -euxo pipefail

exec > >(tee -a /var/log/jenkins-install.log) 2>&1

echo "Updating packages..."
apt-get update

echo "Installing Java..."
apt-get install -y fontconfig openjdk-21-jre

java -version

echo "Adding Jenkins repository..."
install -d -m 0755 /etc/apt/keyrings

wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  > /etc/apt/sources.list.d/jenkins.list

apt-get update

echo "Installing Jenkins..."
apt-get install -y jenkins

echo "Starting Jenkins..."
systemctl enable --now jenkins

systemctl status jenkins --no-pager

echo "Jenkins installation completed successfully!"