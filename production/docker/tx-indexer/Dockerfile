FROM node:20-alpine

WORKDIR /home/safeuser/psf-memo-indexer

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5455

VOLUME start-tx-indexer.sh
CMD ["./start-tx-indexer.sh"]
