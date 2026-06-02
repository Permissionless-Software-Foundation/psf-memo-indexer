FROM node:20-alpine

WORKDIR /home/safeuser/psf-memo-db

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5021

VOLUME start-memo-db.sh
CMD ["./start-memo-db.sh"]
