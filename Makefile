SHELL            := /usr/bin/env bash
LANG             := en_US.UTF-8
DOCKER_USER      ?= quay.io/wire
VERSION          ?= 1.0.7
WIRE_ENV         ?=
DOCKER_TAG       ?= $(VERSION)-$(WIRE_ENV)

guard-be-env-%:
	@ if [[ "${${*}}" != "staging" && "${${*}}" != "prod" ]]; then \
	      echo "Environment variable $* not set to either staging or prod"; \
	    exit 1; \
	fi

.PHONY: docker-build-image
docker-build-image: guard-be-env-WIRE_ENV
	@echo "Building for $(WIRE_ENV)"
	docker build . --build-arg WIRE_ENV=$(WIRE_ENV) -t $(DOCKER_USER)/avs-nwtesttool:$(DOCKER_TAG)

.PHONY: docker-push-image
docker-push-image: guard-be-env-WIRE_ENV docker-build-image
	docker push $(DOCKER_USER)/avs-nwtesttool:$(DOCKER_TAG)
	# After successful push, change the tag too
	@echo "Tagging for $(DOCKER_TAG)"
	sed -i.bak -e "s/\"Name\".*/\"Name\": \"quay.io\/wire\/avs-nwtesttool:$(DOCKER_TAG)\"/g" deploy/Dockerrun.aws.$(WIRE_ENV).json
	rm deploy/Dockerrun.aws.$(WIRE_ENV).json.bak
	@echo "Build and upload succeeded, do not forget to commit the json file too"
