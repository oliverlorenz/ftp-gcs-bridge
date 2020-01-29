FROM node:lts as builder
WORKDIR /app
ADD . /app
RUN npm install && \
    npx typescript --skipLibCheck && \
    rm -rf node_modules && \
    npm install --production

FROM node:lts-alpine3.9 as prod
ENV GOOGLE_APPLICATION_CREDENTIALS /service-account.json
WORKDIR /app
COPY --from=builder /app /app
CMD npm start
