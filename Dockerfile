FROM node:12-alpine AS node

WORKDIR /home/node

COPY ./package.json .
COPY ./src ./src

RUN apk add --no-cache git
RUN npm install --no-optional --no-shrinkwrap --no-package-lock
RUN npm run pkg

FROM alpine:latest

WORKDIR /app

RUN \
  apk add --no-cache libstdc++

COPY --from=node /home/node/confz-* ./

RUN chown -R nobody:nobody .

USER nobody

ENTRYPOINT ["./confz-alpine"]

CMD ["--config", "./confz.d/confz.yaml"]
