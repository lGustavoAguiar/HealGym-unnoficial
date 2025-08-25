FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
RUN npm install -g vite
COPY . .

EXPOSE 3000
CMD ["vite", "--host", "0.0.0.0", "--port", "3000"]
