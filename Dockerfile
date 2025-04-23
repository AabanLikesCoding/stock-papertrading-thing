FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.9-slim

WORKDIR /app

# Install NGINX for proper proxying
RUN apt-get update && \
    apt-get install -y nginx curl procps net-tools && \
    apt-get clean

# Copy backend files
COPY backend/ /app/backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules

# Create NGINX configuration for routing
RUN echo 'server {\n\
    listen $PORT default_server;\n\
    root /app/frontend/.next;\n\
    \n\
    location / {\n\
        proxy_pass http://localhost:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    \n\
    location ~ ^/(stock|trade|trade-history|my-portfolio) {\n\
        proxy_pass http://localhost:8000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/sites-available/default

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Starting backend API server..."\n\
cd /app/backend && uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
BACKEND_PID=$!\n\
\n\
echo "Starting frontend server..."\n\
cd /app/frontend && npx next start -p 3000 &\n\
FRONTEND_PID=$!\n\
\n\
echo "Starting NGINX server..."\n\
sed -i "s/\$PORT/$PORT/g" /etc/nginx/sites-available/default\n\
nginx -g "daemon off;"\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose the port
EXPOSE $PORT 8000 3000

# Start all services
CMD ["/app/start.sh"] 