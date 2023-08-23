# Network Test Tool
#
# Run test tool using Docker:
#
# 1. Create Docker image
# Run from top level directory: docker build -t nwtesttool .
#
# 2. Create container
# docker run --name nwtest -d -p 8080:8080 nwtesttool
#
# 3. Start tool from browser with:
# http://localhost:8080/html/wtest.html
#
# Stop test tool:
#
# 1. Stop container:
# docker stop nwtest
#
# 2. Remove container:
# docker rm nwtest
#
# Update test tool
#
# 1. Stop test tool
#
# 2. Re-run test tool
#
# Remove images (only for cleanup)
#
# docker image rm nwtesttool
# docker image rm nginx:1.23.4-alpine-perl
#

# Parent image
FROM nginx:1.23.4-alpine

# Set the working directory
WORKDIR ./usr/share/nginx/html/

# Copy static html and js directory
COPY ./html/ /usr/share/nginx/html/html/
COPY ./js/ /usr/share/nginx/html/js/
COPY ./styles/ /usr/share/nginx/html/styles/
COPY ./assets/ /usr/share/nginx/html/assets/

# Copy an nginx config to set our main page as the index
# Using 'ADD' instead of 'COPY' invalidates the cache
ADD nginx /etc/nginx

# only replace variables with the following prefixes
ENV NGINX_ENVSUBST_FILTER="BACKEND_HTTPS_"

# set default values for wire staging environment
ENV BACKEND_HTTPS_SFT=*.sft.staging.zinfra.io
ENV BACKEND_HTTPS_URL=staging-nginz-https.zinfra.io

# Make port available to the world outside this container
EXPOSE 8080
