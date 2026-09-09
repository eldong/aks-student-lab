FROM node:20-alpine

WORKDIR /app
COPY package.json server.js ./

ENV NODE_ENV=production
ENV PORT=3000

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
