# Sử dụng NodeJS official image làm base
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json và package-lock.json để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm cả devDependencies để build typescript)
RUN npm install

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Generate Prisma Client để đồng bộ kiểu cơ sở dữ liệu
RUN npx prisma generate

# Biên dịch mã nguồn TypeScript sang JavaScript
RUN npm run build

# Expose cổng chạy ứng dụng Backend
EXPOSE 5000

# Khởi chạy server
CMD ["node", "dist/server.js"]
