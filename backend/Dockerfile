FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache yarn

COPY package.json yarn.lock /app/

RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "run", "dev"]