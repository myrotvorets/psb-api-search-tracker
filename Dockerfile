FROM myrotvorets/node:latest@sha256:147723d2194b5a6dc9b9e8410ebb7033c1810fd29614e761192622768429d194 AS build
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

FROM myrotvorets/node-min@sha256:8017cd12ac8977efc7bda3dc11a48606b0e2978c7fd532037fc290fbb19560b9
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody ./package.json ./
