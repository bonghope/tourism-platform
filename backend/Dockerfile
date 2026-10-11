FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=14927

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
RUN mkdir -p /app/uploads/reviews && chown -R node:node /app/uploads

USER node
EXPOSE 14927
CMD ["node", "server.js"]
