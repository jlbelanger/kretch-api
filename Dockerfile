FROM node:12.14.0-alpine

# Instal global packages.
RUN yarn global add nodemon

# Install application packages.
WORKDIR /usr/src/app
COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY .env .

# Run Node.
USER node
CMD ["nodemon", "start"]

EXPOSE 5308
