# WGU Catalog Management Makefile
# ================================
# Centralized documentation and commands for catalog parsing and management
#
# Usage: make [target]
# Run 'make help' to see all available commands

.PHONY: help parse parse-all fetch-current report clean validate test debug setup

# Default target - show help
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

#################################
# HELP & DOCUMENTATION
#################################

help: ## Show this help message
	@echo "$(BLUE)WGU Catalog Management System$(NC)"
	@echo "=============================="
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Quick Examples:$(NC)"
	@echo "  make parse FILE=pdfs/catalog-2025-08.pdf   # Parse a single catalog"
	@echo "  make parse-all                              # Parse all PDFs in pdfs/"
	@echo "  make fetch-current                          # Download latest catalog"
	@echo "  make report                                 # Generate parsing analytics"
	@echo "  make validate FILE=catalog-2025-08         # Validate a parsed catalog"
	@echo ""

#################################
# PARSING COMMANDS
#################################

parse: ## Parse a single catalog PDF (use FILE=path/to/catalog.pdf)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify a PDF file$(NC)"; \
		echo "Usage: make parse FILE=pdfs/catalog-2025-08.pdf"; \
		exit 1; \
	fi
	@echo "$(BLUE)Parsing $(FILE)...$(NC)"
	@tsx scripts/catalog-parser-unified.ts "$(FILE)"

parse-all: ## Parse all PDFs in the pdfs directory
	@echo "$(BLUE)Parsing all catalogs in pdfs/...$(NC)"
	@tsx scripts/batch-parse-all.ts

parse-latest: ## Parse the most recent catalog PDF
	@echo "$(BLUE)Finding and parsing the latest catalog...$(NC)"
	@LATEST=$$(ls -1 pdfs/catalog-*.pdf 2>/dev/null | sort -r | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "$(RED)No catalog PDFs found in pdfs/$(NC)"; \
		exit 1; \
	fi; \
	echo "$(GREEN)Latest catalog: $$LATEST$(NC)"; \
	tsx scripts/catalog-parser-unified.ts "$$LATEST"

#################################
# CATALOG MANAGEMENT
#################################

fetch-current: ## Download the current WGU catalog
	@echo "$(BLUE)Fetching current WGU catalog...$(NC)"
	@tsx scripts/fetch-current-catalog.ts

fetch-all: ## Download all available WGU catalogs
	@echo "$(BLUE)Downloading all available catalogs...$(NC)"
	@tsx scripts/bulk-download.ts

check-new: ## Check for new catalog releases
	@echo "$(BLUE)Checking for new WGU catalog releases...$(NC)"
	@tsx scripts/check-wgu-catalog.ts

ingest: ## Ingest all PDFs (parse and organize)
	@echo "$(BLUE)Ingesting all catalog PDFs...$(NC)"
	@tsx scripts/ingest-catalogs.ts

#################################
# REPORTING & ANALYTICS
#################################

report: ## Generate comprehensive parsing report
	@echo "$(BLUE)Generating parsing analytics report...$(NC)"
	@tsx scripts/catalog-reporting.ts --all

report-analytics: ## Show detailed parsing analytics
	@echo "$(BLUE)Displaying parsing analytics...$(NC)"
	@tsx scripts/catalog-reporting.ts --analytics

report-readme: ## Update README with parsing results
	@echo "$(BLUE)Updating README.md with latest results...$(NC)"
	@tsx scripts/catalog-reporting.ts --readme

inventory: ## Show catalog inventory and status
	@echo "$(BLUE)Catalog Inventory:$(NC)"
	@echo "=================="
	@echo ""
	@echo "$(YELLOW)PDF Files:$(NC)"
	@ls -lh pdfs/*.pdf 2>/dev/null | wc -l | xargs echo "  Total PDFs:"
	@ls -lh pdfs/*.pdf 2>/dev/null | tail -5 | awk '{print "  " $$9 " (" $$5 ")"}'
	@echo ""
	@echo "$(YELLOW)Parsed JSON Files:$(NC)"
	@ls -lh parsed/*.json 2>/dev/null | grep -v ".report.json" | wc -l | xargs echo "  Total parsed:"
	@ls -lh parsed/*.json 2>/dev/null | grep -v ".report.json" | tail -5 | awk '{print "  " $$9 " (" $$5 ")"}'
	@echo ""
	@echo "$(YELLOW)Parsing Reports:$(NC)"
	@ls -lh parsed/*.report.json 2>/dev/null | wc -l | xargs echo "  Total reports:"

#################################
# VALIDATION & TESTING
#################################

validate: ## Validate a parsed catalog (use FILE=catalog-name without extension)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify a catalog name$(NC)"; \
		echo "Usage: make validate FILE=catalog-2025-08"; \
		exit 1; \
	fi
	@echo "$(BLUE)Validating $(FILE)...$(NC)"
	@if [ -f "parsed/$(FILE).json" ] && [ -f "parsed/$(FILE).report.json" ]; then \
		echo "$(GREEN)✓ Catalog JSON found$(NC)"; \
		echo "$(GREEN)✓ Report JSON found$(NC)"; \
		echo ""; \
		echo "$(YELLOW)Validation Summary:$(NC)"; \
		jq -r '.validation.degreePlanCourseValidation | "  Course validation: \(.validationRate)%"' parsed/$(FILE).report.json; \
		jq -r '.validation.degreePlanCourseValidation | "  Missing courses: \(.missingCourses | length)"' parsed/$(FILE).report.json; \
		jq -r '.summary | "  Total issues: \(.validationIssues)"' parsed/$(FILE).report.json; \
	else \
		echo "$(RED)✗ Catalog files not found$(NC)"; \
		echo "  Expected: parsed/$(FILE).json and parsed/$(FILE).report.json"; \
		exit 1; \
	fi

test: ## Run comprehensive catalog tests
	@echo "$(BLUE)Running catalog parser tests...$(NC)"
	@tsx tests/comprehensive-test.ts

test-catalog: ## Test a specific catalog (use FILE=path/to/catalog.pdf)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify a PDF file$(NC)"; \
		echo "Usage: make test-catalog FILE=pdfs/catalog-2025-08.pdf"; \
		exit 1; \
	fi
	@echo "$(BLUE)Testing $(FILE)...$(NC)"
	@tsx tests/catalog-tester.ts "$(FILE)"

#################################
# DEBUGGING & DEVELOPMENT
#################################

debug-formats: ## Debug catalog format detection
	@echo "$(BLUE)Analyzing catalog formats...$(NC)"
	@for pdf in pdfs/catalog-*.pdf; do \
		echo ""; \
		echo "$(YELLOW)$$pdf:$(NC)"; \
		tsx scripts/catalog-parser-unified.ts "$$pdf" 2>&1 | grep -E "(Detected format:|Strategy:)" || true; \
	done

debug-missing-data: ## Analyze missing data patterns
	@echo "$(BLUE)Analyzing missing data in latest catalog...$(NC)"
	@LATEST=$$(ls -1 parsed/catalog-*.json 2>/dev/null | grep -v ".report.json" | sort -r | head -1); \
	if [ -n "$$LATEST" ]; then \
		echo "$(GREEN)Analyzing: $$LATEST$(NC)"; \
		tsx analyze-missing-cus.ts 2>/dev/null || echo "$(YELLOW)Script not found. Creating analysis...$(NC)"; \
	fi

compare-catalogs: ## Compare two catalogs (use OLD=catalog-YYYY-MM NEW=catalog-YYYY-MM)
	@if [ -z "$(OLD)" ] || [ -z "$(NEW)" ]; then \
		echo "$(RED)Error: Please specify both OLD and NEW catalogs$(NC)"; \
		echo "Usage: make compare-catalogs OLD=catalog-2025-07 NEW=catalog-2025-08"; \
		exit 1; \
	fi
	@echo "$(BLUE)Comparing $(OLD) vs $(NEW)...$(NC)"
	@echo "$(YELLOW)Course count changes:$(NC)"
	@OLD_COUNT=$$(jq '.metadata.statistics.coursesFound' parsed/$(OLD).json 2>/dev/null || echo 0); \
	NEW_COUNT=$$(jq '.metadata.statistics.coursesFound' parsed/$(NEW).json 2>/dev/null || echo 0); \
	echo "  $(OLD): $$OLD_COUNT courses"; \
	echo "  $(NEW): $$NEW_COUNT courses"; \
	echo "  Change: $$(($$NEW_COUNT - $$OLD_COUNT)) courses"

#################################
# CLEANUP & MAINTENANCE
#################################

clean: ## Remove temporary files and debug outputs
	@echo "$(BLUE)Cleaning temporary files...$(NC)"
	@rm -f *.log
	@rm -f debug-*.ts
	@rm -f test-*.ts
	@rm -f analyze-*.ts
	@rm -f fix-*.ts
	@rm -f spot-check-*.json
	@rm -f standalone-courses.*
	@rm -rf pdf_samples/
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

clean-all: clean ## Remove all generated files (includes parsed data)
	@echo "$(RED)Warning: This will remove all parsed data!$(NC)"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read confirm
	@rm -f parsed/*.json
	@rm -f parsed/*.report.json
	@echo "$(GREEN)✓ All generated files removed$(NC)"

#################################
# SETUP & CONFIGURATION
#################################

setup: ## Initial setup and dependency check
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)✗ Node.js not found$(NC)"; exit 1; }
	@command -v npx >/dev/null 2>&1 || { echo "$(RED)✗ npx not found$(NC)"; exit 1; }
	@command -v pdftoppm >/dev/null 2>&1 || { echo "$(YELLOW)⚠ pdftoppm not found (optional for PDF screenshots)$(NC)"; }
	@echo "$(GREEN)✓ Core dependencies found$(NC)"
	@echo ""
	@echo "$(BLUE)Installing npm packages...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Setup complete$(NC)"

verify-structure: ## Verify directory structure
	@echo "$(BLUE)Verifying directory structure...$(NC)"
	@for dir in pdfs parsed scripts scripts/lib; do \
		if [ -d "$$dir" ]; then \
			echo "$(GREEN)✓ $$dir/$(NC)"; \
		else \
			echo "$(RED)✗ $$dir/ (missing)$(NC)"; \
		fi \
	done

#################################
# ADVANCED WORKFLOWS
#################################

workflow-monthly: fetch-current parse-latest report ## Complete monthly workflow
	@echo "$(GREEN)✓ Monthly workflow complete!$(NC)"

workflow-new-catalog: ## Process a newly added catalog (use FILE=path/to/new.pdf)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify a PDF file$(NC)"; \
		echo "Usage: make workflow-new-catalog FILE=pdfs/catalog-2025-09.pdf"; \
		exit 1; \
	fi
	@echo "$(BLUE)Processing new catalog: $(FILE)$(NC)"
	@$(MAKE) parse FILE="$(FILE)"
	@BASENAME=$$(basename "$(FILE)" .pdf); \
	$(MAKE) validate FILE="$$BASENAME"
	@$(MAKE) report-readme
	@echo "$(GREEN)✓ New catalog processed successfully!$(NC)"

workflow-quality-check: ## Run quality checks on all parsed catalogs
	@echo "$(BLUE)Running quality checks...$(NC)"
	@TOTAL=0; PASSED=0; \
	for json in parsed/catalog-*.json; do \
		if [ -f "$$json" ] && ! echo "$$json" | grep -q ".report.json"; then \
			TOTAL=$$((TOTAL + 1)); \
			BASENAME=$$(basename "$$json" .json); \
			echo ""; \
			echo "$(YELLOW)Checking $$BASENAME...$(NC)"; \
			if [ -f "parsed/$$BASENAME.report.json" ]; then \
				RATE=$$(jq -r '.validation.degreePlanCourseValidation.validationRate' "parsed/$$BASENAME.report.json" 2>/dev/null || echo "0"); \
				if [ "$$(echo "$$RATE > 95" | bc -l 2>/dev/null || echo 0)" = "1" ]; then \
					echo "$(GREEN)✓ Validation rate: $$RATE%$(NC)"; \
					PASSED=$$((PASSED + 1)); \
				else \
					echo "$(RED)✗ Validation rate: $$RATE% (below 95% threshold)$(NC)"; \
				fi \
			else \
				echo "$(RED)✗ No report found$(NC)"; \
			fi \
		fi \
	done; \
	echo ""; \
	echo "$(BLUE)Quality Check Summary:$(NC)"; \
	echo "  Total catalogs: $$TOTAL"; \
	echo "  Passed (>95%): $$PASSED"; \
	echo "  Failed: $$((TOTAL - PASSED))"

#################################
# SHORTCUTS & ALIASES
#################################

p: parse ## Shortcut for parse
pa: parse-all ## Shortcut for parse-all
r: report ## Shortcut for report
v: validate ## Shortcut for validate
c: clean ## Shortcut for clean

# Special targets that don't need .PHONY
list-courses: ## List all unique course codes across catalogs
	@echo "$(BLUE)Extracting unique course codes...$(NC)"
	@jq -r '.courses | keys[]' parsed/catalog-*.json 2>/dev/null | sort -u | head -20
	@echo "..."
	@echo "$(YELLOW)Total unique courses:$(NC) $$(jq -r '.courses | keys[]' parsed/catalog-*.json 2>/dev/null | sort -u | wc -l)"

stats: ## Show quick statistics
	@echo "$(BLUE)Catalog Statistics$(NC)"
	@echo "=================="
	@echo "PDFs available: $$(ls pdfs/*.pdf 2>/dev/null | wc -l)"
	@echo "Catalogs parsed: $$(ls parsed/*.json 2>/dev/null | grep -v ".report.json" | wc -l)"
	@echo "Reports generated: $$(ls parsed/*.report.json 2>/dev/null | wc -l)"
	@echo ""
	@LATEST=$$(ls -1 parsed/catalog-*.report.json 2>/dev/null | sort -r | head -1); \
	if [ -n "$$LATEST" ]; then \
		echo "$(YELLOW)Latest catalog stats:$(NC)"; \
		jq -r '.summary | "  Courses: \(.totalCourses)\n  Degree Plans: \(.totalDegreePlans)\n  Program Outcomes: \(.totalProgramOutcomes)\n  CCN Coverage: \(.ccnCoverage)%\n  CU Coverage: \(.cuCoverage)%"' "$$LATEST"; \
	fi