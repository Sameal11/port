FROM node:20-bookworm-slim

# The API creates resume PDFs. Use the distribution Chromium instead of
# downloading a second browser during npm install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY server/scripts server/scripts
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev --workspace server

COPY server server
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 5000
CMD ["node", "server/server.js"]
