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

.PHONY: release
release: clean test lint build
	# Check that the version in $VERSION is correct.
	test `cat lerna.json | jq ".version"` = '"${VERSION}"'
	# Check that there are no uncommitted changes.
	git diff-index --quiet HEAD --
	git tag ${VERSION}
	git push
	git push --tags
	lerna publish
