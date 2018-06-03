FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/winprobviz
WORKDIR /usr/src/winprobviz

# Install app dependencies
COPY package.json /usr/src/winprobviz/
COPY package-lock.json /usr/src/winprobviz/
RUN npm install

# Bundle app source
COPY . /usr/src/winprobviz

EXPOSE 8080
CMD [ "npm", "start" ]
