# WGU Catalog Automation

This directory contains automation tools for monitoring and downloading new WGU institutional catalogs.

## 🔄 Automated Catalog Checking

### GitHub Action
- **Schedule**: Runs monthly on the 1st day of each month at 9:00 AM UTC
- **File**: `.github/workflows/catalog-check.yml`
- **Purpose**: Automatically check for and download new WGU catalogs

### Local Script
- **File**: `scripts/check-wgu-catalog.ts`
- **Usage**: `npm run catalog:check`
- **Purpose**: Manual catalog checking and downloading

## 📋 How It Works

### 1. URL Pattern Detection
The checker looks for catalogs using multiple naming patterns:

```
# Numeric pattern
https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/YYYY/catalog-YYYY-MM.pdf

# Month name pattern  
https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/YYYY/catalog-monthYYYY.pdf

# Current date pattern (for very recent catalogs)
https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/YYYY/catalog-current-YYYY-MM-DD.pdf
```

### 2. Page Structure Validation
Before checking for catalogs, the system:
- Validates the WGU catalog page is accessible
- Extracts the current catalog URL from the page
- Verifies our URL patterns match WGU's current structure
- Detects any changes to the page layout

### 2. Catalog Detection
- Validates WGU catalog page structure first
- Checks for catalogs from current month and previous month
- Verifies URLs exist with HEAD requests
- Downloads only new catalogs not already present locally
- Validates downloaded files (size check)

### 3. Automated Processing
When new catalogs are found:
1. Downloads PDFs to `data/catalogs/pdfs/`
2. Runs the unified catalog parser to extract course and degree data
3. **Generates detailed comparison with the previous catalog**
4. Creates a pull request with the new catalog(s) and comparison report
5. Includes processing results and metadata

### 4. Catalog Comparison
The system automatically compares new catalogs with the most recent existing catalog:
- **Course Changes**: New, removed, and modified courses
- **Degree Plan Changes**: New, removed, and modified degree plans  
- **Metadata Analysis**: CCN coverage, statistics
- **Significance Detection**: Highlights major changes
- **Markdown Report**: Formatted for GitHub PR descriptions

## 🎯 Usage Examples

### Run Locally
```bash
# Check WGU catalog page structure
npm run catalog:check-page

# Check for new catalogs
npm run catalog:check

# Compare two catalogs
npm run catalog:compare catalog-2025-08.pdf

# Check results
cat catalog-page-check-results.json
cat catalog-check-results.json
cat catalog-comparison-report.md
```

### Manual Trigger via GitHub
1. Go to Actions tab in GitHub
2. Select "WGU Catalog Check" workflow
3. Click "Run workflow"

### Expected Behavior
- **New catalogs found**: Creates PR with downloaded catalogs, parsed data, and detailed comparison report
- **No new catalogs**: Logs completion, no further action
- **Errors**: Logs errors, uploads results as artifacts

## 📊 Results Format

The checker creates `catalog-check-results.json` and `catalog-comparison-report.md`:

**catalog-check-results.json:**
```json
{
  "date": "2025-08-09T08:15:02.661Z",
  "newCatalogs": ["catalog-2025-08.pdf"],
  "totalCatalogs": 118,
  "checkedUrls": [
    "https://www.wgu.edu/content/dam/..."
  ],
  "errors": []
}
```

**catalog-comparison-report.md:**
```markdown
### 📊 Catalog Comparison Report
**Period:** 2025-07-01 → 2025-08-01
**Previous:** `catalog-2025-07.pdf`
**New:** `catalog-2025-08.pdf`

#### 🎯 Significant Changes
- 🆕 12 new courses added
- 🗑️ 9 courses removed
...
```

## 🔧 Configuration

### Environment Variables
- `WGU_CATALOG_BASE_URL`: Base URL for WGU catalogs (set in workflow)

### Timing
- **Production**: 1st of every month at 9:00 AM UTC
- **Manual**: Anytime via workflow dispatch

### File Locations
- **Downloaded catalogs**: `data/catalogs/`
- **Parsed data**: `data/catalogs/parsed/`
- **Results**: `catalog-check-results.json` (temporary)

## 📝 Maintenance

### Adding New URL Patterns
Edit `scripts/check-wgu-catalog.ts` and add new patterns to `generateCatalogCandidates()`.

### Changing Schedule
Edit the cron expression in `.github/workflows/catalog-check.yml`:
```yaml
schedule:
  - cron: '0 9 1 * *'  # Monthly on 1st at 9 AM UTC
```

### Updating Processing
The workflow automatically runs the catalog parser on new catalogs. To change processing:
1. Edit the "Process new catalogs" step in the workflow
2. Update catalog parser scripts in `data/catalogs/`

## 🚨 Troubleshooting

### Common Issues
1. **Download timeouts**: Increase `TIMEOUT_MS` in the script
2. **Invalid URLs**: Check WGU's catalog URL structure hasn't changed
3. **Parser failures**: Verify catalog format compatibility

### Debugging
- Check workflow logs in GitHub Actions
- Run locally with `npm run catalog:check`
- Review `catalog-check-results.json` for details

## 🔮 Future Enhancements

- [ ] Email notifications for new catalogs
- [ ] Diff analysis between catalog versions
- [ ] Automatic catalog comparison reports
- [ ] Integration with course change tracking
- [ ] Slack/Discord notifications for team alerts
