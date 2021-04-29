FROM node:14

ENV local /usr/src/recipe-search-demo
ENV url https://github.com/lp28/recipe-search-demo.git

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3030
CMD [ "sh", "-c", "node app.js --url=${url} --local=${local}"]