FROM node:20-slim

WORKDIR /app

# Install ClamAV
RUN apt-get update && \
    apt-get install -y clamav clamav-freshclam && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 3000

CMD ["npm", "run", "express"]
