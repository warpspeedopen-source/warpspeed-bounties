FROM node:18-alpine

RUN apk add --no-cache tesseract-ocr

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/index.js"]