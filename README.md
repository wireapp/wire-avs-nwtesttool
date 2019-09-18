# wire-avs-nwtesttool

How to run:

1. From root directory run in command line: 

test/generate-pemfile.sh

This will generate a pem file used for HTTPS, which is requred for cross-domain communication.
 
2. Run in command line:

python test/local-ssl-server.py
 
3. Open in browser:

https://localhost:4443/html/wtest.html

