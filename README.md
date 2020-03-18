# wire-avs-nwtesttool

The Audio/Video/Signalling network testing tool for Wire.

This tool provides a browser interface to see which TURN/restund servers (the servers used when making audio/video calls using Wire) are being used by Wire clients, and whether any problems exist related to:
* connecting from your device to the restund/TURN servers
* network bandwith with respect to establishing connections (how many people can be in the same call with you from your perspective)

The information gathered can be helpful to debug networking, firewall, and configuration issues.

## Configuration

The environment variable `BACKEND_HTTPS_URL` must be set to point to a wire backend.

```sh
# example, adjust as needed
export BACKEND_HTTPS_URL=nginz-https.example.com
```

## Running the tool

There are multiple ways to run/build:

### Run using Docker locally

Follow the instructions in the `Dockerfile`

### Run using python locally

For testing use a python web server:

1. From root directory run in command line:

```sh
test/generate-pemfile.sh
```

This will generate a pem file used for HTTPS, which is requred for cross-domain communication.

2. Run in command line:

```sh
python test/local-ssl-server.py
```

3. Open in browser:

https://localhost:4443/html/wtest.html

## For maintainers (wire employees)

Follow the instructions in the Makefile to build and push docker images to quay.io.

0. Ensure you have access to quay.io (`docker login quay.io`)
1. Change the version in the Makefile
2. Run `make docker-push-image`, this also changes the respective JSON file under deploy/, ensure to commit it afterwards too.
3. Follow the procedure in the backend-wiki for deployment.

TODO: automate this on CI.

## License

AGPL. See the `LICENSE` file.
