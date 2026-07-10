FROM node:20-alpine 
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# For Express
EXPOSE 3000