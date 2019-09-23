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

# Parent image
FROM nginx:alpine

# Set the working directory
WORKDIR ./usr/share/nginx/html/

# Create directories
RUN mkdir js
RUN mkdir html

# Copy static html and js directory
COPY ./html/ /usr/share/nginx/html/html/
COPY ./js/ /usr/share/nginx/html/js/

# Make port available to the world outside this container
EXPOSE 8080

