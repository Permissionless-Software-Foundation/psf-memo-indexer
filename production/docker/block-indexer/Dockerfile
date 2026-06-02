FROM node:20-alpine

WORKDIR /home/safeuser/psf-memo-indexer

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

VOLUME start-block-indexer.sh
CMD ["./start-block-indexer.sh"]
