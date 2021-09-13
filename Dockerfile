FROM node:11.6.0

COPY . /home/api

WORKDIR "/home/api"

RUN npm install --silent
RUN chmod +x ./bin/api.js

EXPOSE 3000

CMD [ "npm", "start" ]
