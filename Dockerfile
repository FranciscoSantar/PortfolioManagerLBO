FROM node:24.14-alpine as builder
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:24.14-alpine as runner

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist

RUN adduser --disabled-password runnerUser
RUN chown -R runnerUser:runnerUser /app
USER runnerUser

CMD [ "node","dist/src/main" ]