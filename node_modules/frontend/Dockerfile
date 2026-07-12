# --- Stage 1: Build React App ---
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Biên dịch ứng dụng sang thư mục /dist
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Sao chép các tệp tĩnh đã biên dịch từ Stage 1 vào thư mục phục vụ của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép tệp cấu hình Nginx tùy chỉnh của ta vào container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose cổng chạy Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
