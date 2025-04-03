FROM node:20-alpine

RUN apk add --no-cache yarn

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "run", "dev"]