FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN npm i -g yarn --force
RUN yarn

COPY . .

EXPOSE 3000

CMD [ "yarn", "start" ]
