FROM node:10 AS node

WORKDIR /home/node

COPY ./package.json .
COPY ./package-lock.json .
COPY ./src ./src

RUN npm install
RUN npm run pkg

FROM alpine:latest

WORKDIR /home/app

RUN \
  apk add --no-cache libstdc++ shadow && \
  groupadd -g 1000 app && \
  useradd -r -m -u 1000 -g app app

COPY --from=node /home/node/confz-* ./

USER app

ENTRYPOINT ["./confz-alpine"]

CMD ["--config", "./confz.d/confz.yaml"]
