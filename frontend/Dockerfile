FROM node:20-alpine AS builder
# I'm building the build of the react code
# PAKAGES LIST -> INSTALL DEPENDENCIES -> COPY CODE -> NPM RUN BUILD 
WORKDIR /app
COPY package*.json /.
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY rate-limit.conf /etc/nginx/conf.d/rate-limit.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx is on 80 port
EXPOSE 80
CMD ["nginx","-g","daemon off;"]