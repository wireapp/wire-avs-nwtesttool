# Network Test Tool
#
# Run test tool using Docker:
#
# 1. Create Docker image
# Run from top level directory: docker build -t nwtesttool .
#
# 2. Create container
# docker run --name nwtest -d -p 8080:80 nwtesttool
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
# docker image rm nginx:alpine
#

# Parent image
FROM nginx:alpine

# This should be set to either staging or prod
ARG WIRE_ENV=staging

RUN echo "Build for ${WIRE_ENV}"

# Set the working directory
WORKDIR ./usr/share/nginx/html/

# Create directories
RUN mkdir js
RUN mkdir html

# Copy static html and js directory
COPY ./html/ /usr/share/nginx/html/html/
COPY ./js/ /usr/share/nginx/html/js/

# Run some magic sed which will set the right backend environment
RUN sed -i.bak -e "s/let backendUrl = .*/let backendUrl = ${WIRE_ENV}Url;/g" /usr/share/nginx/html/html/wtest.html

# Copy an nginx config to set our main page as the index
COPY nginx.conf /etc/nginx/nginx.conf

# Make port available to the world outside this container
EXPOSE 80

