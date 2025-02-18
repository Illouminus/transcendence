FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npx", "nodemon", "--legacy-watch", "src/server.ts"]