# --- build stage ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# 如果你的项目是 TS：先编译产物到 dist
RUN npm run build

# --- runtime stage ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 只拷贝运行期需要的文件（更小更安全）
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# 你是 ESM 就 `node dist/index.js`；如果用 tsx 直跑则改命令
CMD ["node", "dist/index.js"]