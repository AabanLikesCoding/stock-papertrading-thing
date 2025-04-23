FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.9-slim

WORKDIR /app

# Install NGINX and debugging tools
RUN apt-get update && \
    apt-get install -y nginx curl procps net-tools iputils-ping dnsutils vim && \
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

# Create a simplified NGINX configuration that directly passes all requests to the backend
RUN echo 'server {\n\
    listen $PORT default_server;\n\
    server_name _;\n\
    access_log /var/log/nginx/access.log;\n\
    error_log /var/log/nginx/error.log debug;\n\
    \n\
    # Frontend\n\
    location / {\n\
        proxy_pass http://127.0.0.1:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    \n\
    # Simple API endpoints\n\
    location /stock/ {\n\
        proxy_pass http://127.0.0.1:8000/stock/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
    }\n\
    \n\
    location /make-trade {\n\
        proxy_pass http://127.0.0.1:8000/make-trade;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
    }\n\
    \n\
    location /my-portfolio/ {\n\
        proxy_pass http://127.0.0.1:8000/my-portfolio/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
    }\n\
}\n' > /etc/nginx/sites-available/default

# Simple health check script
RUN echo '#!/bin/bash\n\
echo "Testing API..."\n\
curl -v http://localhost:8000/stock/AAPL\n\
' > /app/test_api.sh
RUN chmod +x /app/test_api.sh

# Create a robust startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
mkdir -p /app/logs\n\
\n\
echo "===== STARTING BACKEND ====="\n\
cd /app/backend\n\
python -m uvicorn my_stock_app:my_app --host 0.0.0.0 --port 8000 --log-level debug > /app/logs/backend.log 2>&1 &\n\
BACKEND_PID=$!\n\
echo "Backend started with PID: $BACKEND_PID"\n\
\n\
# Wait for the backend to start\n\
echo "Waiting for backend to be ready..."\n\
for i in {1..10}; do\n\
  echo "Attempt $i: Checking if backend is up..."\n\
  if curl -s http://localhost:8000/ > /dev/null; then\n\
    echo "Backend is up!"\n\
    break\n\
  fi\n\
  if [ $i -eq 10 ]; then\n\
    echo "Backend failed to start. Check logs:"\n\
    cat /app/logs/backend.log\n\
    exit 1\n\
  fi\n\
  sleep 2\n\
done\n\
\n\
# Test the stock API\n\
echo "Testing stock API..."\n\
curl -v http://localhost:8000/stock/AAPL > /app/logs/api_test.log 2>&1\n\
if [ $? -ne 0 ]; then\n\
  echo "API test failed. Check logs:"\n\
  cat /app/logs/api_test.log\n\
  exit 1\n\
fi\n\
\n\
echo "===== STARTING FRONTEND ====="\n\
cd /app/frontend\n\
npx next start -p 3000 > /app/logs/frontend.log 2>&1 &\n\
FRONTEND_PID=$!\n\
echo "Frontend started with PID: $FRONTEND_PID"\n\
\n\
echo "===== STARTING NGINX ====="\n\
sed -i "s/\$PORT/$PORT/g" /etc/nginx/sites-available/default\n\
cat /etc/nginx/sites-available/default > /app/logs/nginx_config.log\n\
nginx -t > /app/logs/nginx_test.log 2>&1\n\
\n\
# Monitor the processes\n\
nginx -g "daemon off;"\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose the ports
EXPOSE $PORT 8000 3000

# Start all services
CMD ["/app/start.sh"] 