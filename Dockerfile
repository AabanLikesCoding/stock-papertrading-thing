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
    apt-get install -y nginx curl procps net-tools iputils-ping dnsutils && \
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

# Create NGINX configuration with explicit backend routes
RUN echo 'server {\n\
    listen $PORT default_server;\n\
    server_name _;\n\
    access_log /var/log/nginx/access.log;\n\
    error_log /var/log/nginx/error.log debug;\n\
    \n\
    location / {\n\
        proxy_pass http://127.0.0.1:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
    \n\
    location /stock/ {\n\
        proxy_pass http://127.0.0.1:8000/stock/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    \n\
    location /make-trade {\n\
        proxy_pass http://127.0.0.1:8000/make-trade;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    \n\
    location /my-portfolio/ {\n\
        proxy_pass http://127.0.0.1:8000/my-portfolio/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/sites-available/default

# Create a comprehensive debugging script
RUN echo '#!/bin/bash\n\
# Start and monitor all services with detailed logging\n\
\n\
mkdir -p /app/logs\n\
\n\
# Start backend with detailed logging\n\
cd /app/backend\n\
echo "Starting backend on port 8000..."\n\
python -m uvicorn my_stock_app:my_app --host 0.0.0.0 --port 8000 --log-level debug > /app/logs/backend.log 2>&1 &\n\
BACKEND_PID=$!\n\
echo "Backend started with PID: $BACKEND_PID"\n\
\n\
# Wait for backend to start\n\
echo "Waiting for backend to be ready..."\n\
sleep 5\n\
\n\
# Debug backend connection\n\
echo "Checking backend API..."\n\
curl -v http://localhost:8000/ > /app/logs/backend_check.log 2>&1\n\
\n\
# Start frontend with detailed logging\n\
cd /app/frontend\n\
echo "Starting frontend on port 3000..."\n\
npx next start -p 3000 > /app/logs/frontend.log 2>&1 &\n\
FRONTEND_PID=$!\n\
echo "Frontend started with PID: $FRONTEND_PID"\n\
\n\
# Configure and start NGINX\n\
echo "Configuring and starting NGINX..."\n\
sed -i "s/\$PORT/$PORT/g" /etc/nginx/sites-available/default\n\
cat /etc/nginx/sites-available/default > /app/logs/nginx_config.log\n\
nginx -t > /app/logs/nginx_test.log 2>&1\n\
\n\
# Start NGINX in the foreground\n\
echo "Starting NGINX..."\n\
nginx -g "daemon off;"\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose the ports
EXPOSE $PORT 8000 3000

# Start all services
CMD ["/app/start.sh"] 