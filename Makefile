SHELL            := /usr/bin/env bash
LANG             := en_US.UTF-8
DOCKER_USER      ?= quay.io/wire
DOCKER_TAG       ?= 1.0.23

.PHONY: docker-build-image
docker-build-image:
	docker buildx build --platform linux/amd64 . -t $(DOCKER_USER)/avs-nwtesttool:$(DOCKER_TAG)

.PHONY: docker-push-image
docker-push-image: docker-build-image
	docker push $(DOCKER_USER)/avs-nwtesttool:$(DOCKER_TAG)
	# After successful push, change the tag on the local file too
	sed -i.bak -e "s/\"Name\".*/\"Name\": \"quay.io\/wire\/avs-nwtesttool:$(DOCKER_TAG)\"/g" deploy/Dockerrun.aws.json
	rm deploy/Dockerrun.aws.json.bak
	@echo "Build and upload succeeded, do not forget to commit the change to the json file too"
