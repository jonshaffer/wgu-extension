# WGU Catalog Parser Versions

This directory contains versioned parsers for WGU institutional catalogs to handle format changes over time.

## Available Parsers

### v1.0 - Legacy Parser (2017-2020)
**File**: `ingest-catalog-v1.ts`  
**Target**: Catalogs from 2017-2020 timeframe

**Format Characteristics**:
- CCNs embedded in course names (e.g., "BUS 3650 - Course Title")
- Simpler degree plan table structures  
- Different course code patterns (3-4 letter codes + 1-3 digits)
- Less structured competency unit information

**Usage**:
```bash
npm run data:ingest:catalog:v1
```

**Results** (Jan 2017 catalog):
- 78 courses found
- 78% CCN coverage
- 0% CU coverage (needs enhancement)

### v2.0 - Modern Parser (2021+)
**File**: `ingest-catalog.ts`  
**Target**: Current catalog format (2021-present)

**Format Characteristics**:
- Separate CCN fields in degree plan tables
- Structured competency unit data
- Enhanced course code patterns
- Complex degree plan table formats

**Usage**:
```bash
npm run data:ingest:catalog
```

**Results** (August 2025 catalog):
- 830 courses found  
- 96.6% CCN coverage
- 97.2% CU coverage

### Auto-Detection System
**File**: `ingest-catalog-auto.ts`  
**Purpose**: Automatically selects appropriate parser based on catalog date

**Usage**:
```bash
npm run data:ingest:catalog:auto
```

**Detection Rules**:
- Pre-2021 catalogs → v1.0 Legacy Parser
- 2021+ catalogs → v2.0 Modern Parser
- Filename date extraction for automatic detection

## Catalog Sources

Catalogs are available from: https://www.wgu.edu/about/institutional-catalog.html

**Currently Available**:
- `catalog-Jan2017.pdf` - Legacy format example
- `catalog-august-2025.pdf` - Current format

## Adding New Catalog Versions

When catalog formats change significantly:

1. **Create new versioned parser**: `ingest-catalog-v3.ts`
2. **Update auto-detection rules** in `ingest-catalog-auto.ts`
3. **Add new script** to `package.json`
4. **Document format differences** in this README

## Format Version Metadata

Each parser includes detailed format version metadata:

```typescript
const FORMAT_VERSION: CatalogFormatVersion = {
  major: 1,
  minor: 0, 
  patch: 0,
  identifier: "WGU-Catalog-Legacy-2017-2020",
  characteristics: {
    courseCodePatterns: ["[A-Z]{3,4}\\d{1,3}"],
    ccnFormat: "Embedded in course name",
    degreeTableFormat: "Simple list format",
    textFormatNotes: ["CCNs stored as part of course names"]
  },
  dateRange: {
    firstSeen: "2017-01",
    lastSeen: "2020-12"
  }
};
```

## Output Files

Parsed data is saved with version suffixes:
- `catalog-Jan2017-parsed-v1.json` - v1.0 parser output
- `catalog-Jan2017-summary-v1.json` - v1.0 parser summary
- `catalog-august-2025-parsed.json` - v2.0 parser output  
- `catalog-august-2025-summary.json` - v2.0 parser summary

## Performance Comparison

| Parser | Catalog | Courses | CCN Coverage | CU Coverage | Processing Time |
|--------|---------|---------|-------------|-------------|----------------|
| v1.0   | Jan 2017| 78      | 78%         | 0%          | ~370ms         |
| v2.0   | Aug 2025| 830     | 96.6%       | 97.2%       | ~580ms         |

## Future Enhancements

- **v1 CU Extraction**: Improve competency unit parsing for legacy catalogs
- **v3 Parser**: Prepare for future format changes
- **Degree Plan Parsing**: Enhance legacy degree plan extraction
- **Performance**: Optimize parsing speed for large catalogs
