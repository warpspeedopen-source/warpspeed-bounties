FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma migrate dev --name init
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]