FROM node:22-bookworm-slim

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Configure entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["npm", "run", "express"]