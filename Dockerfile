FROM node:14

LABEL org.opencontainers.image.source https://github.com/ovrclk/faucet

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN npm i -g yarn --force
RUN yarn

COPY . .

EXPOSE 3000

CMD [ "yarn", "start" ]
