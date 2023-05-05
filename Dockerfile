FROM node:18

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY . .

ENV PORT=5000

RUN yarn build

EXPOSE 5000

CMD ["yarn", "start:prod"]