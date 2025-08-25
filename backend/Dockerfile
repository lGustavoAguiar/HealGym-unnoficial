FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
RUN npm install -g nodemon
COPY . .

EXPOSE 5000
CMD ["nodemon", "server.js"]
