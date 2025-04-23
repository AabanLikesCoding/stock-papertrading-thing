FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.9-slim

WORKDIR /app

# Copy backend files
COPY backend/ /app/backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules

# Install debugging tools
RUN apt-get update && apt-get install -y curl procps net-tools && apt-get clean

# Create a startup script that ensures proper API routing
RUN echo '#!/bin/bash\n\
echo "Starting backend API server..."\n\
cd /app/backend && uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
BACKEND_PID=$!\n\
echo "Backend started with PID: $BACKEND_PID"\n\
echo "Waiting for backend to be ready..."\n\
sleep 5\n\
echo "Starting frontend server..."\n\
cd /app/frontend && PORT=$PORT npx next start\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose the port
EXPOSE $PORT 8000

# Start both services
CMD ["/app/start.sh"] 