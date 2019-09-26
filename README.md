# wire-avs-nwtesttool

3 ways to run/build:

a) Docker (local): Follow instructions in Dockerfile

b) Docker (for publish): Follow instructions in Makefile

  * Ensure you have access to quay.io (`docker login quay.io`)
    * If not, ask someone in the Backend team for an account that gives you write access to this repo
  * Change the version in the Makefile
  * Run `make docker-push-image`
  * This also changes the respective JSON file under deploy/, ensure to commit it afterwards too.
  * Once the image is published to quay.io, go to the ElasticBeanstalk console on the webapp's AWS account: https://eu-west-1.console.aws.amazon.com/elasticbeanstalk/home?region=eu-west-1#/applications select the desired environment and upload the json file in the option `Upload and Deploy`. More info here: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/single-container-docker-configuration.html#single-container-docker-configuration.dockerrun
  * Note that there's a `BACKEND_HTTPS_URL` environment variable defined on each Beanstalk environment so the builds can be used for any environment now (and default to staging if no variable is defined)

c) For testing use a python web server:


1. From root directory run in command line:

test/generate-pemfile.sh

This will generate a pem file used for HTTPS, which is requred for cross-domain communication.

2. Run in command line:

python test/local-ssl-server.py

3. Open in browser:

https://localhost:4443/html/wtest.html

