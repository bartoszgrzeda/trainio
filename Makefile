.PHONY: dev-ios

dev-ios:
	API_URL="$(API_URL)" SIMULATOR="$(SIMULATOR)" ./scripts/dev-ios.sh
