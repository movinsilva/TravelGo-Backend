FROM node:18



# Copy Package Json Files
COPY package*.json ./

# Install files
RUN npm install

# Copy source files
COPY . .


# Expose the api port
EXPOSE 5000

ENV NODE_ENV=development
ENV PORT=5000
ENV POSTGRESQL_HOST=localhost
ENV POSTGRESQL_USER=postgres
ENV POSTGRESQL_PASSWORD=movin123
ENV POSTGRESQL_PORT=5432
ENV POSTGRESQL_DATABASE=travelgodb
ENV JWT_SECRET=nadeeshashehanmovin

CMD [ "node", "src/server.js"]