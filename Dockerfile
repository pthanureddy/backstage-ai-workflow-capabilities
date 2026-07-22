FROM node:24-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY plugins ./plugins
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /workspace
RUN corepack enable
COPY --from=build /workspace /workspace
USER node
EXPOSE 7007
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:7007/api/ai-workflows/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "plugins/ai-workflows-backend/dist/standalone.js"]
