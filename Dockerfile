FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/iconvault/package.json ./artifacts/iconvault/
COPY scripts/package.json ./scripts/
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV NODE_ENV=production

RUN pnpm --filter @workspace/iconvault run build
RUN pnpm --filter @workspace/api-server run build:api-only

EXPOSE 3000
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
