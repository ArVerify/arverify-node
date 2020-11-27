FROM node:lts-alpine

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build
ENV PORT=$PORT
EXPOSE 3000
CMD [ "yarn", "start:docker" ]
