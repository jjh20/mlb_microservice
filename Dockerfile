
FROM node:20-slim


WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install

COPY . .

# Puerto
EXPOSE 3000

# Comando para correr nuestra app
CMD ["node", "server.js"]