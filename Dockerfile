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
  apk add --no-cache libstdc++ && \
  addgroup -g 65530 -S app && \
  adduser -u 65530 -h /app -G app -S app

COPY --from=node /home/node/confz-* ./

RUN chown -R app:app .

USER app

ENTRYPOINT ["./confz-alpine"]

CMD ["--config", "./confz.d/confz.yaml"]
