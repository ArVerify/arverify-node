FROM node:lts-alpine

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
