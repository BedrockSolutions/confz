FROM node:10-alpine AS node

WORKDIR /home/node

COPY ./package.json .
COPY ./package-lock.json .
COPY ./src ./src

RUN npm install
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
