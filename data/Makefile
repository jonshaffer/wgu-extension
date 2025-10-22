# WGU Extension Data Pipeline
# Contributor-friendly commands for data processing

.PHONY: help dev-setup test validate parse monitor clean

# Default target - show help
help:
	@echo "WGU Extension Data Pipeline"
	@echo "=========================="
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev-setup    - Set up local development environment"
	@echo "  make test         - Run all tests"
	@echo "  make help         - Show this help"
	@echo ""
	@echo "Data Processing:"
	@echo "  make parse-catalog FILE=path/to/catalog.pdf  - Parse a specific catalog"
	@echo "  make parse-latest                            - Parse the most recent catalog"
	@echo "  make validate-all                            - Validate all data sources"
	@echo ""
	@echo "Development:"
	@echo "  make test-parser FILE=path/to/catalog.pdf   - Test parser on specific file"
	@echo "  make test-collection                         - Test browser collection logic"
	@echo "  make preview                                 - Preview data changes"
	@echo "  make monitor-health                          - Check parser health"
	@echo "  make refresh-cache                           - Update dev-cache with latest live data"
	@echo ""
	@echo "Specific Validators:"
	@echo "  make validate-discord    - Check Discord invite links"
	@echo "  make validate-reddit     - Verify subreddit data"
	@echo "  make validate-catalog    - Validate parsed catalog data"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean generated files"

# Set up development environment
dev-setup:
	@echo "🚀 Setting up development environment..."
	@npm install
	@echo "📥 Setting up development data..."
	@npm run dev-setup
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Run 'make test' to verify setup"
	@echo "  2. See CONTRIBUTING.md for how to help"

# Refresh dev cache with latest data from GraphQL
refresh-cache:
	@echo "🔄 Refreshing dev cache from GraphQL API..."
	@npm run populate:dev-cache

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@npm test

# Parse a specific catalog
parse-catalog:
ifndef FILE
	@echo "❌ Error: Please specify a catalog file"
	@echo "Usage: make parse-catalog FILE=sources/catalogs/catalog-2025-08.pdf"
	@exit 1
endif
	@echo "📚 Parsing catalog: $(FILE)"
	@npm run parse:catalog -- $(FILE)
	@echo "📊 Generating health report..."
	@npm run health:catalog -- $(FILE)

# Parse the latest catalog
parse-latest:
	@echo "🔍 Finding latest catalog..."
	@LATEST=$$(ls -1 sources/catalogs/catalog-*.pdf 2>/dev/null | sort -r | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "❌ No catalogs found in sources/catalogs/"; \
		exit 1; \
	fi; \
	echo "📚 Parsing latest: $$LATEST"; \
	npm run parse:catalog -- "$$LATEST"

# Test parser on a specific file
test-parser:
ifndef FILE
	@echo "❌ Error: Please specify a catalog file"
	@echo "Usage: make test-parser FILE=sources/catalogs/catalog-2025-08.pdf"
	@exit 1
endif
	@echo "🧪 Testing parser on: $(FILE)"
	@npm run test:parser -- $(FILE)

# Test browser collection logic
test-collection:
	@echo "🧪 Testing collection logic..."
	@npm run test:collection

# Validate all data sources
validate-all:
	@echo "✅ Validating all data sources..."
	@npm run validate:all
	@echo ""
	@echo "✅ All validations passed!"

# Validate Discord data
validate-discord:
	@echo "💬 Validating Discord servers..."
	@npm run validate:discord

# Validate Reddit data
validate-reddit:
	@echo "📱 Validating Reddit communities..."
	@npm run validate:reddit

# Validate catalog data
validate-catalog:
	@echo "📚 Validating catalog data..."
	@npm run validate:catalog

# Preview data changes
preview:
	@echo "👀 Generating preview..."
	@npm run preview
	@echo ""
	@echo "Preview available at: output/preview/"

# Monitor parser health
monitor-health:
	@echo "📊 Checking parser health..."
	@npm run monitor:health
	@echo ""
	@echo "Health reports available in: analytics/reports/"

# Build collection logic for browser extension
build-collection:
	@echo "🔨 Building collection logic..."
	@npm run build:collection
	@echo "✅ Collection bundle ready at: ../extension/public/data/collection.js"

# Sync data to Firestore
sync-firestore:
	@echo "☁️  Syncing to Firestore..."
	@npm run sync:firestore

# Clean generated files
clean:
	@echo "🧹 Cleaning generated files..."
	@rm -rf dev-cache/*
	@rm -rf output/preview/*
	@echo "✅ Clean complete"

# Development shortcuts
.PHONY: dev parse val

dev: dev-setup
parse: parse-latest
val: validate-all

# CI/CD targets
.PHONY: ci-test ci-validate

ci-test:
	@npm run test:ci

ci-validate:
	@npm run validate:ci