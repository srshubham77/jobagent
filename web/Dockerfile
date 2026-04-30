FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Set service URLs at build time so Next.js/webpack can inline them correctly.
# These are the Docker Compose internal hostnames — correct when running in Docker.
ENV AUTH_SERVICE_URL=http://auth:8086
ENV PROFILE_SERVICE_URL=http://profile:8081
ENV DISCOVERY_SERVICE_URL=http://discovery:8082
ENV MATCHER_SERVICE_URL=http://matcher:8083
ENV APPLY_SERVICE_URL=http://apply:8084
ENV TRACKER_SERVICE_URL=http://tracker:8085
ENV NEXTAUTH_URL=http://localhost:3000
RUN npm run build && mkdir -p /app/public

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
