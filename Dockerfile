FROM myrotvorets/node:latest@sha256:73f9eb3b5df3a53e6a4f561f551193ce43d3858d1325bb3d82ad224c39e9d4bf AS build
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

FROM myrotvorets/node-min@sha256:b34751aac3e4cf0f107f6080b0b8a4072110b8427d4b601b6e8245e97378990a
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody ./package.json ./
