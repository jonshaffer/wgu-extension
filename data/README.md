# WGU Extension Data Pipeline

This directory contains all data collection, processing, and validation for the WGU Extension.

## 🚀 Quick Start for Contributors

```bash
# Set up your development environment
make dev-setup

# Run tests to verify setup
make test

# See all available commands
make help
```

**Note**: `make dev-setup` will attempt to fetch live data from our GraphQL API. If the API is unavailable, it will fall back to creating sample data for local development.

## 📁 Directory Structure

```
data/
├── sources/              # Raw input data
│   ├── catalogs/        # WGU PDF catalogs (monthly releases)
│   ├── discord/         # Discord server information
│   ├── reddit/          # Reddit community data
│   └── wgu-connect/     # WGU Connect groups
│
├── pipelines/           # Data processing code
│   ├── _shared/         # Shared utilities and types
│   ├── catalog/         # PDF parsing and analysis
│   ├── discord/         # Discord validation
│   ├── reddit/          # Reddit validation
│   └── unified/         # Cross-data integration
│
├── collection/          # Browser extension features
│   ├── discord/         # Auto-suggest Discord servers
│   └── wgu-connect/     # Extract from authenticated pages
│
├── experiments/         # Try new parsing approaches here
├── monitors/            # Automated health checks
├── analytics/           # Parser performance reports
└── dev-cache/          # Local development data (git-ignored)
```

## 🛠️ Common Tasks

### Parse the Latest Catalog
```bash
make parse-latest
```

### Parse a Specific Catalog
```bash
make parse-catalog FILE=sources/catalogs/catalog-2025-08.pdf
```

### Validate All Data
```bash
make validate-all
```

### Check Parser Health
```bash
make monitor-health
```

## 📊 Data Flow

1. **Sources** → Raw PDFs and community data
2. **Pipelines** → Parse, validate, and transform
3. **Firestore** → Store processed data
4. **GraphQL API** → Serve to extension and website

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Key Areas:
- **Catalog Parsing**: Improve PDF data extraction
- **Community Data**: Add Discord/Reddit communities
- **Validation**: Ensure data quality
- **Browser Collection**: Help students find resources

## 🚀 CI/CD Pipeline

Our automated pipeline ensures data quality and updates Firestore automatically:

### For Contributors:
1. **Submit PR** with parser improvements or new data
2. **CI runs parsers** and validates output
3. **Review results** in PR comments
4. **Upon merge**, data automatically uploads to Firestore

### Workflows:
- **data-cd.yml**: Processes catalog PDFs when parsers change
- **community-data-cd.yml**: Validates and uploads community data
- Both run on PRs for validation, upload on merge to main

## 🔍 Architecture Notes

### Firestore as Source of Truth
- Live data is stored in Firestore
- Files are used for:
  - Raw sources (PDFs)
  - Parse analytics and health reports
  - Local development cache
  - Historical snapshots

### Parser Versioning
We maintain multiple parser versions as PDF formats change:
- `v1.0` (2017-2020): Embedded CCN format
- `v2.0` (2021-2023): Structured tables
- `v2.1` (2024+): Enhanced format with outcomes

### Health Monitoring
Every parse generates health metrics to detect:
- Format changes in PDFs
- Parsing degradation
- Missing data

## Data Version Control (DVC)

⚠️ **Important**: Large files (PDFs and historical data) are managed with DVC and stored in Google Drive.

### DVC-Managed Files:
- **Catalog PDFs**: `sources/catalogs/*.pdf`
- **Historical parsed data**: `analytics/history/*.json`
- **Large datasets**: Check `.dvc` files

```bash
# Pull all DVC-managed files
dvc pull

# Or pull specific directories
dvc pull data/sources/catalogs/
```

## 📚 Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [docs/PARSING.md](docs/PARSING.md) - Catalog parsing details
- [docs/COMMUNITIES.md](docs/COMMUNITIES.md) - Community data guide
- [docs/COLLECTION.md](docs/COLLECTION.md) - Browser extension guide

## 🧪 Testing

```bash
# Test everything
make test

# Test specific components
make test-parser FILE=sources/catalogs/catalog-2025-08.pdf
make test-collection
```

## 📈 Monitoring

Check parser health and data quality:
```bash
make monitor-health
```

Reports are saved to `analytics/reports/`

## Future

Course Descriptions & Course of Study
https://cm.wgu.edu/t5/Information-Resources/Course-Descriptions-and-Course-of-Study/ta-p/38923
https://app.sharebase.com/#/folder/6002/share/138-4wgYt3vWGssTwqC11wc--K-ggKp8

All Degree Programs (to get Program Guides)
https://www.wgu.edu/online-degree-programs.html
