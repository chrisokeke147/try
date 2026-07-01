FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=optional
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --omit=optional
COPY --from=build /app/dist ./dist
# node:alpine already ships an unprivileged "node" user (uid 1000) — running
# as root inside the container is unnecessary and widens the blast radius
# of any RCE-class bug in the app or its dependencies.
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
