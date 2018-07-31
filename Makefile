default: test lint build docs

.PHONY: node_modules
node_modules:
	yarn install
	yarn lerna bootstrap

.PHONY: build
build: node_modules
	yarn lerna run build

.PHONE: docs
docs: node_modules
	yarn lerna run docs

.PHONY: test
test: node_modules build
	yarn test

.PHONY: lint
lint: node_modules
	yarn lint

.PHONY: clean
clean:
	yarn lerna run clean

.PHONY: publish
publish: node_modules build lint test
	git diff-index --quiet HEAD --
	yarn lerna publish
