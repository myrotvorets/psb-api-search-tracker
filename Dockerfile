FROM myrotvorets/node:latest@sha256:590d12a205062842fb2438b5056c39f73b45b2cd88263e8bafd38853b64c1b6e AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nogroup /srv/service
USER nobody:nogroup
COPY --chown=nobody:nogroup ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:00b0af3fcb7d0ae1540cc5373785a433b8039e9ab7e17975eea5f9004cc6f88b
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody ./package.json ./
