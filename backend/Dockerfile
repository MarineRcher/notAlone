FROM node:23-alpine

WORKDIR /app

RUN apk add --no-cache yarn

COPY package.json yarn.lock /app/

RUN mkdir -p /app/logs && chown -R node:node /app

RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "run", "dev"]
