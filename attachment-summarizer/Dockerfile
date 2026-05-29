FROM node:20-alpine

# Install tesseract dependencies for OCR
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npm run postinstall

COPY . .

RUN npm run build

CMD ["npm", "start"]
