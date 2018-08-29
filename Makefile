default: test lint build docs

.PHONY: node_modules
node_modules:
	yarn install
	yarn lerna bootstrap
	cd website && yarn

.PHONY: build
build: node_modules
	yarn lerna run build

.PHONY: docs
docs: node_modules
	yarn lerna run docs
	cd website && yarn build
	rm -rf website/build/hyrest-docs/api
	mkdir website/build/hyrest-docs/api
	cp -rl packages/hyrest/docs website/build/hyrest-docs/api/hyrest
	cp -rl packages/hyrest-express/docs website/build/hyrest-docs/api/hyrest-express

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

.PHONY: docs-start
docs-start: node_modules
	cd website && yarn start
