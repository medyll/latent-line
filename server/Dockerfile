FROM node:20-alpine AS build

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM node:20-alpine AS runtime

RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY workflows ./workflows
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
