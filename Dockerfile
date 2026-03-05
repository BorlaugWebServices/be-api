FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/bin/api.js"]