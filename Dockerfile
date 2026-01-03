FROM node:12.14.0-alpine

# Instal global packages.
RUN npm install --global nodemon

# Install application packages.
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY .env .

# Run Node.
USER node
CMD ["nodemon", "start"]

EXPOSE 5308
