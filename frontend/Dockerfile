FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]


# Dockerfile
#    │
#    ├── FROM       → Node 20
#    ├── WORKDIR    → /app
#    ├── COPY       → package.json
#    ├── RUN        → npm install
#    ├── COPY       → code dyal React
#    ├── EXPOSE     → port 5173
#    └── CMD        → chghal Vite