FROM node:20-alpine

WORKDIR /app

COPY . .
RUN npm i 
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]