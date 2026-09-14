FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# OpenShift runs containers as a random, non-root UID by default, but always
# in group 0 (root group). Making the app directory group-writable and
# group-owned lets that random UID still write to uploads/ etc.
RUN mkdir -p uploads/photos \
  && chgrp -R 0 /app \
  && chmod -R g=u /app

EXPOSE 4000
ENV PORT=4000

# Explicit non-root USER as a sane local-Docker default; OpenShift will
# override this with its own random UID at deploy time regardless.
USER 1001

CMD ["node", "server.js"]
