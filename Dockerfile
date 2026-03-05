FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


RUN npm prune --omit=dev


FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/bin/api.js"]