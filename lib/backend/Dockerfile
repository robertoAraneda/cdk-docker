FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

ENV PORT 3000

EXPOSE 3000

RUN npm install

COPY . .

CMD ["node", "app.js"]