FROM node
WORKDIR /app
COPY package.json ./
RUN npm install && npm cache clean --force
ENV PATH=/app/node_modules/.bin:$PATH
## EXPOSE [Port you mentioned in the vite.config file]
ARG port
ENV env_port $port
EXPOSE $port
CMD ["npm", "run", "dev"]

