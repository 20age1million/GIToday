# ---------- build stage: 编译 TypeScript ----------
FROM node:24-alpine AS build
WORKDIR /app

# 仅拷贝声明文件，最大化缓存命中
COPY package*.json ./
RUN npm ci

# 拷贝源码并编译到 dist/
COPY tsconfig.json ./
COPY src ./src
# 如有其它需要的静态文件（例如命令注册脚本等），按需 COPY
COPY scripts ./scripts

# 编译 TS → dist
RUN npm run build

# ---------- runtime stage: 仅含运行时所需 ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 只安装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 仅拷贝编译产物
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
RUN chmod +x scripts/entrypoint.sh

# RUN mkdir -p /app/config

# RUN node ./dist/init.js

# 可选：将默认用户切到非 root（官方 node 镜像内置 "node" 用户）
# USER node
