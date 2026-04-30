# ---------------------------------------------------------------
# Dockerfile — FitPay Elite (Gateway + all services)
# Used by Render when deploying as a Docker service.
# ---------------------------------------------------------------

FROM node:20-slim

WORKDIR /app

# Copy all service source code
COPY implementations/ ./implementations/

# Install dependencies for each service
WORKDIR /app/implementations/AuthMembership/backend-api_Module1
RUN npm install

WORKDIR /app/implementations/course-service
RUN npm install

WORKDIR /app/implementations/payment-service
RUN npm install

WORKDIR /app/implementations/reservation-service/backend
RUN npm install

WORKDIR /app/implementations/Admin
RUN npm install

# Back to gateway directory for startup
WORKDIR /app/implementations/AuthMembership/backend-api_Module1

EXPOSE 8080

CMD ["node", "server.js"]
