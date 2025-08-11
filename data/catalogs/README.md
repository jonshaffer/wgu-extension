# WGU Catalog Parser

## 📋 Overview

Production-ready system for extracting, parsing, and maintaining Western Governors University's academic catalog data. Provides both historical catalog preservation (2017-) and live catalog monitoring capabilities.

## 📁 Directory Structure

 `pdfs/` - Catalog PDF files
 `parsed/` - Processed JSON catalog data
 `scripts/` - Callable parsing/ingestion scripts (moved from core)
 `types/` - Canonical TypeScript types and JSON Schema (catalog-data.ts, catalog-data.schema.json)

## 🎯 Current Status (August 2025)

- ✅ **Complete Historical Dataset**: 117 catalogs (116 historical + 1 current)
- ✅ **High-Quality Parser**: 97% course completion rate, 95% CCN coverage
- ✅ **Live Capability**: Automated current catalog fetching and parsing
- ✅ **Advanced Features**: CCN mapping, CU extraction, detailed descriptions
- ✅ **Production Ready**: Organized codebase with comprehensive documentation

## 🚀 Quick Start

### Parse Current WGU Catalog
```bash
# Download and parse the latest catalog
npx tsx scripts/fetch-current-catalog.ts

# Parse only (if already downloaded)
npx tsx scripts/fetch-current-catalog.ts --parse-only

# Test existing parsed data
npx tsx scripts/fetch-current-catalog.ts --test-only
```

### Analyze Data Quality
```bash
# Comprehensive analysis of all parsed catalogs
npx tsx scripts/analyze-parsing-state.ts
```

### Parse Historical Catalogs
```bash
# Parse a specific catalog
npx tsx scripts/catalog-parser-unified.ts pdfs/catalog-2024-10.pdf

# Batch parse all catalogs
npx tsx scripts/batch-parse-all.ts
```

### Convert PDFs to JSON (Single CLI)
```bash
# Convert all PDFs in data/catalogs/pdfs to parsed JSON
npx tsx scripts/ingest-catalogs.ts

# Convert a specific file with explicit strategy
npx tsx scripts/ingest-catalogs.ts pdfs/catalog-2025-08.pdf --kind modern
```

## 📁 Directory Structure

```
data/catalogs/
├── README.md                           # This file
│
├── scripts/                            # Parsing and utility scripts
│   ├── catalog-parser-unified.ts       # Main parser (moved from core)
│   ├── analyze-parsing-state.ts        # Data quality analysis
│   ├── fetch-current-catalog.ts        # Live catalog fetcher
│   └── lib/                            # Supporting modules (config, logger, etc.)
│
├── pdfs/                               # Catalog PDF files
├── parsed/                             # Processed JSON files
│
├── current/                            # Live catalog system
│   └── cache/                          # Current catalog cache
│
├── scripts/                            # Utility scripts
│   ├── bulk-download.ts                # Historical bulk download
│   ├── batch-parse-all.ts              # Batch processing
│   ├── catalog-inventory.ts            # Inventory management
│   └── archive/                        # Archived/obsolete scripts
│
├── tests/                              # Testing and validation
│   ├── comprehensive-test.ts           # Full system tests
│   ├── catalog-tester.ts               # Individual catalog tests
│   └── generate-samples.ts             # Test data generation
│
└── docs/                               # Documentation
    ├── REQUIREMENTS.md                 # Complete system requirements
    ├── CURRENT-STATE.md                # Current status analysis
    └── IMPLEMENTATION_SUMMARY.md       # Implementation notes
```

## 🔧 Core Components

### 1. Unified Parser (`scripts/catalog-parser-unified.ts`)
**Production-ready parser handling all WGU catalog formats (2017-2025)**

**Features:**
- ✅ Automatic format detection
- ✅ Legacy parser (5 patterns) for 2017-2020 catalogs
- ✅ Modern parser (3 patterns) for 2021-2025 catalogs
- ✅ CCN extraction (95% coverage on current catalogs)
- ✅ CU extraction (85% coverage on current catalogs)
- ✅ Degree plan extraction (4 patterns)
- ✅ Detailed description enhancement

**Usage:**
```bash
npx tsx scripts/catalog-parser-unified.ts path/to/catalog.pdf
```

### 1b. Ingest Strategies (`scripts/lib/ingest-types.ts`)
Provides a light abstraction for `legacy`, `modern`, or `auto` ingestion. The unified parser auto-detects by default; use `--kind` if needed.

### 2. Live Catalog Fetcher (`scripts/fetch-current-catalog.ts`)
**Automated downloader and parser for current WGU catalogs**

**Features:**
- ✅ Downloads from official WGU URLs
- ✅ Automatic URL fallback system
- ✅ Integrated quality testing
- ✅ Multiple execution modes

**Current Working URLs:**
- January 2025: ✅ Active
- October 2024: ✅ Available
- March 2024: ✅ Available

### 3. Quality Analyzer (`scripts/analyze-parsing-state.ts`)
**Comprehensive data quality analysis and reporting**

**Metrics:**
- Course extraction success rates
- CCN/CU coverage analysis
- Year-over-year quality trends
- Data completeness scoring

## 📊 Data Quality Standards

## 🤖 Automation

Monthly GitHub Action checks for new catalogs and standardizes downloaded filenames. The local script `scripts/check-wgu-catalog.ts` can be run to discover and download new releases. New catalogs are parsed, compared to the prior month, and surfaced in PRs. See `.github/workflows/catalog-check.yml` for schedule and steps.

### Current Catalog (January 2025)
- **Courses**: 788 extracted
- **Descriptions**: 97.2% (766 courses)
- **CCN Coverage**: 94.8% (747 courses)
- **CU Coverage**: 84.8% (668 courses)
- **Processing Time**: <2 minutes

### Historical Average (2017-2025)
- **Course Completion**: 97%+ across all catalogs
- **CCN Coverage**: 26% average (17,436 courses)
- **CU Coverage**: 22% average (14,737 courses)
- **Catalog Coverage**: 100% (all semesters 2017-2025)

## 🎯 Data Schema

### Course Object
```typescript
interface Course {
  courseCode: string;           // "C182", "D270", etc.
  courseName: string;           // Course title
  description: string;          // Course description
  ccn?: string;                // Community College Number
  competencyUnits?: number;     // CU value
  prerequisites?: string[];     // Prerequisite courses
  level?: 'undergraduate' | 'graduate';
  lastUpdated: string;          // ISO date string
}
```

### Degree Plan Object
```typescript
interface DegreePlan {
  programCode: string;          // Program identifier
  programName: string;          // Degree program name
  level: 'undergraduate' | 'graduate';
  totalCUs: number;
  courses: string[];            // Course codes in sequence
  description?: string;
  lastUpdated: string;
}
```

## 🔍 Quality Assurance

### Validation Rules
- **Course Completeness**: >95% courses have code, name, description
- **CCN Coverage**: >90% undergraduate courses (current catalogs)
- **CU Coverage**: >80% all courses (current catalogs)
- **Description Quality**: >50 characters average length
- **Data Consistency**: No duplicate course codes per catalog

### Testing
```bash
# Run comprehensive tests
npx tsx tests/comprehensive-test.ts

# Test specific catalog
npx tsx tests/catalog-tester.ts path/to/catalog.pdf

# Generate test samples
npx tsx tests/generate-samples.ts
```

## 🚀 Integration

### For WGU Extension
The parsed JSON data is ready for direct integration:

```typescript
// Load parsed catalog data
const catalogData = JSON.parse(fs.readFileSync('parsed/catalog-2024-10-parsed.json', 'utf-8'));

// Access courses
const courses = catalogData.courses;
const course = courses['C182']; // Specific course

// Access degree plans
const degreePlans = catalogData.degreePlans;
```

### Output Format
Each parsed catalog generates a JSON file with:
- `courses`: Object with course code as key, course data as value
- `degreePlans`: Array of degree plan objects
- `metadata`: Parser version, processing time, quality metrics

## 📈 Performance

- **Processing Speed**: <2 minutes per catalog (300+ pages)
- **Memory Usage**: <1GB peak during processing
- **Success Rate**: 97%+ course extraction
- **Reliability**: 99%+ parsing success across all formats
- **Storage**: 450MB for 117 parsed catalogs

## 🔧 Maintenance

### Regular Tasks
1. **Monthly**: Check for new WGU catalog releases
2. **Quarterly**: Run full quality analysis
3. **Annually**: Update parser for format changes

### Monitoring
```bash
# Check system health
npx tsx scripts/analyze-parsing-state.ts

# Validate recent catalogs
npx tsx tests/comprehensive-test.ts
```

## 📚 Documentation

- **[REQUIREMENTS.md](docs/REQUIREMENTS.md)**: Complete system requirements (512 lines)
- **[CURRENT-STATE.md](docs/CURRENT-STATE.md)**: Current status analysis (316 lines)
- **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)**: Implementation notes

## 🤝 Contributing

1. **Setup**: `npm install` in project root
2. **Test**: Run existing tests before changes
3. **Document**: Update relevant documentation
4. **Quality**: Maintain >95% parsing success rate

## 📄 License

Part of the WGU Extension project - see main project for license details.

---

**Last Updated**: August 8, 2025  
**System Version**: v2.1-current  
**Data Coverage**: 2017-2025 (Complete)  
**Production Status**: ✅ Ready






## Parsing Results

| File | Date | Pages | Courses | Plans | CCN% | CU% | Parser | PDF Version | PDF Title |
|------|------|-------|---------|-------|------:|----:|--------|------------|-----------|
| catalog-2025-08.json | 2025 (Current) | 355 | 828 | 64 | 93 | 86 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-07.json | 2025 (Current) | 357 | 825 | 63 | 94 | 87 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-06.json | 2025 (Current) | 348 | 818 | 63 | 94 | 87 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-05.json | 2025 (Current) | 343 | 811 | 63 | 94 | 87 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-04.json | 2025 (Current) | 342 | 811 | 63 | 94 | 87 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-03.json | 2025 (Current) | 341 | 809 | 63 | 95 | 87 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2025-02.json | 2025 (Current) | 352 | 860 | 65 | 95 | 87 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2025-01.json | 2025 (Current) | 329 | 788 | 56 | 95 | 85 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2024-12.json | 2024 (Current) | 327 | 781 | 57 | 95 | 85 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2024-11.json | 2024 (Current) | 325 | 780 | 57 | 95 | 85 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2024-10.json | 2024 (Current) | 325 | 778 | 57 | 95 | 85 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2024-09.json | 2024 (Current) | 321 | 785 | 53 | 96 | 85 | v2.1-current | 1.7 | WGU Insitutional Catalog |
| catalog-2024-08.json | 2024 (Current) | 267 | 741 | 43 | 95 | 84 | v2.1-current | 1.7 | WGU Institutional Catalog |
| catalog-2024-07.json | 2024 (Current) | 261 | 753 | 41 | 89 | 78 | v2.1-current | 1.6 | WGU Institutional Catalog |
| catalog-2024-06.json | 2024 (Current) | 254 | 695 | 40 | 96 | 85 | v2.1-current | 1.6 | WGU Institutional Catalog |
| catalog-2024-05.json | 2024 (Current) | 246 | 680 | 38 | 95 | 83 | v2.1-current | 1.6 | WGU Institutional Catalog - May 2024 |
| catalog-2024-04.json | 2024 (Current) | 246 | 680 | 36 | 95 | 83 | v2.1-current | 1.6 | WGU Institutional Catalog - April 2024 |
| catalog-2024-03.json | 2024 (Current) | 245 | 678 | 35 | 95 | 83 | v2.1-current | 1.6 | WGU Institutional Catalog - March 2024 |
| catalog-2024-02.json | 2024 (Current) | 244 | 678 | 35 | 94 | 82 | v2.1-current | 1.6 | WGU Institutional Catalog |
| catalog-2024-01.json | 2024 (Current) | 240 | 672 | 34 | 92 | 80 | v2.1-current | 1.6 | WGU Institutional Catalog |
| catalog-2023-12.json | 2023 (Modern) | 239 | 854 | 35 | 59 | 73 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-11.json | 2023 (Modern) | 238 | 674 | 34 | 92 | 81 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-10.json | 2023 (Modern) | 238 | 674 | 35 | 92 | 81 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-09.json | 2023 (Modern) | 239 | 703 | 35 | 94 | 78 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-08.json | 2023 (Modern) | 237 | 703 | 35 | 94 | 78 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-07.json | 2023 (Modern) | 236 | 708 | 33 | 94 | 78 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-06.json | 2023 (Modern) | 236 | 709 | 33 | 94 | 78 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-05.json | 2023 (Modern) | 235 | 709 | 33 | 94 | 78 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-04.json | 2023 (Modern) | 232 | 709 | 33 | 93 | 77 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-03.json | 2023 (Modern) | 230 | 699 | 31 | 93 | 77 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-02.json | 2023 (Modern) | 229 | 704 | 31 | 93 | 77 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2023-01.json | 2023 (Modern) | 228 | 704 | 31 | 92 | 76 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-12.json | 2022 (Modern) | 221 | 641 | 31 | 97 | 79 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-11.json | 2022 (Modern) | 221 | 667 | 30 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-10.json | 2022 (Modern) | 225 | 669 | 30 | 96 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-09.json | 2022 (Modern) | 223 | 669 | 30 | 96 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-08.json | 2022 (Modern) | 223 | 669 | 30 | 96 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-07.json | 2022 (Modern) | 220 | 660 | 30 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-06.json | 2022 (Modern) | 220 | 659 | 30 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog - June 2022 |
| catalog-2022-05.json | 2022 (Modern) | 208 | 647 | 28 | 96 | 79 | v2.0-modern | 1.4 | WGU Institutional Catalog - May 2022 |
| catalog-2022-04.json | 2022 (Modern) | 207 | 620 | 28 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-03.json | 2022 (Modern) | 204 | 613 | 27 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-02.json | 2022 (Modern) | 204 | 613 | 27 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2022-01.json | 2022 (Modern) | 206 | 613 | 27 | 96 | 79 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-12.json | 2021 (Modern) | 203 | 600 | 28 | 97 | 80 | v2.0-modern | 1.6 | WGU Institutional Catalog |
| catalog-2021-11.json | 2021 (Modern) | 203 | 608 | 28 | 95 | 78 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-10.json | 2021 (Modern) | 203 | 608 | 28 | 95 | 78 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-09.json | 2021 (Modern) | 201 | 599 | 28 | 96 | 79 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-08.json | 2021 (Modern) | 205 | 591 | 28 | 97 | 80 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-07.json | 2021 (Modern) | 205 | 591 | 28 | 97 | 80 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-06.json | 2021 (Modern) | 205 | 591 | 28 | 97 | 80 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-05.json | 2021 (Modern) | 204 | 591 | 28 | 97 | 80 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-04.json | 2021 (Modern) | 204 | 591 | 28 | 97 | 81 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-03.json | 2021 (Modern) | 212 | 591 | 28 | 97 | 80 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-02.json | 2021 (Modern) | 208 | 575 | 28 | 97 | 81 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2021-01.json | 2021 (Modern) | 208 | 575 | 28 | 97 | 81 | v2.0-modern | 1.4 | WGU Institutional Catalog |
| catalog-2020-12.json | 2020 (Legacy) | 208 | 526 | 28 | 96 | 81 | v1.0-legacy | 1.4 | December 2020, WGU Institutional Catalog |
| catalog-2020-11.json | 2020 (Legacy) | 206 | 516 | 29 | 96 | 80 | v1.0-legacy | 1.4 | November 2020, WGU Institutional Catalog |
| catalog-2020-10.json | 2020 (Legacy) | 204 | 516 | 29 | 96 | 80 | v1.0-legacy | 1.4 | October 2020, WGU Institutional Catalog |
| catalog-2020-09.json | 2020 (Legacy) | 202 | 504 | 28 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2020-08.json | 2020 (Legacy) | 202 | 505 | 28 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2020-07.json | 2020 (Legacy) | 201 | 505 | 28 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2020-06.json | 2020 (Legacy) | 200 | 512 | 28 | 96 | 80 | v1.0-legacy | 1.4 | June 2020 WGU Institutional Catalog |
| catalog-2020-05.json | 2020 (Legacy) | 200 | 513 | 29 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2020-04.json | 2020 (Legacy) | 200 | 513 | 23 | 96 | 80 | v1.0-legacy | 1.4 | April 2020 WGU Institutional Catalog |
| catalog-2020-03.json | 2020 (Legacy) | 201 | 505 | 22 | 95 | 79 | v1.0-legacy | 1.4 | March 2020, WGU Institutional Catalog |
| catalog-2020-02.json | 2020 (Legacy) | 200 | 505 | 22 | 94 | 78 | v1.0-legacy | 1.4 | February 2020 WGU Institutional Catalog |
| catalog-2020-01.json | 2020 (Legacy) | 197 | 496 | 28 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2019-12.json | 2019 (Legacy) | 197 | 496 | 28 | 96 | 80 | v1.0-legacy | 1.4 | WGU Institutional Catalog |
| catalog-2019-11.json | 2019 (Legacy) | 197 | 499 | 28 | 96 | 80 | v1.0-legacy | 1.6 | Institutional Catalog V4 |
| catalog-2019-10.json | 2019 (Legacy) | 197 | 498 | 28 | 96 | 80 | v1.0-legacy | 1.4 | Institutional Catalog Oct2019 |
| catalog-2019-09.json | 2019 (Legacy) | 197 | 499 | 28 | 96 | 80 | v1.0-legacy | 1.4 | Institutional Catalog, Sept2019 |
| catalog-2019-08.json | 2019 (Legacy) | 194 | 466 | 27 | 96 | 79 | v1.0-legacy | 1.4 | Institutional Catalog, Aug2019 |
| catalog-2019-07.json | 2019 (Legacy) | 195 | 466 | 27 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2019-06.json | 2019 (Legacy) | 194 | 454 | 27 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2019-05.json | 2019 (Legacy) | 195 | 474 | 28 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2019-04.json | 2019 (Legacy) | 195 | 474 | 28 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2019-03.json | 2019 (Legacy) | 194 | 464 | 29 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2019-02.json | 2019 (Legacy) | 194 | 464 | 29 | 96 | 79 | v1.0-legacy | 1.4 | Institutional Catalog, February 2019 |
| catalog-2019-01.json | 2019 (Legacy) | 194 | 464 | 29 | 96 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2018-12.json | 2018 (Legacy) | 194 | 464 | 29 | 95 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2018-11.json | 2018 (Legacy) | 193 | 458 | 28 | 95 | 78 | v1.0-legacy | 1.6 |  |
| catalog-2018-10.json | 2018 (Legacy) | 193 | 456 | 26 | 96 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2018-09.json | 2018 (Legacy) | 188 | 444 | 25 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2018-08.json | 2018 (Legacy) | 188 | 441 | 25 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2018-07.json | 2018 (Legacy) | 189 | 443 | 25 | 96 | 79 | v1.0-legacy | 1.4 |  |
| catalog-2018-06.json | 2018 (Legacy) | 187 | 407 | 24 | 92 | 77 | v1.0-legacy | 1.4 |  |
| catalog-2018-05.json | 2018 (Legacy) | 188 | 424 | 23 | 93 | 76 | v1.0-legacy | 1.4 |  |
| catalog-2018-04.json | 2018 (Legacy) | 186 | 425 | 23 | 91 | 77 | v1.0-legacy | 1.4 |  |
| catalog-2018-03.json | 2018 (Legacy) | 184 | 413 | 23 | 92 | 77 | v1.0-legacy | 1.4 |  |
| catalog-2018-02.json | 2018 (Legacy) | 184 | 415 | 23 | 93 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2018-01.json | 2018 (Legacy) | 184 | 415 | 23 | 93 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2017-12.json | 2017 (Legacy) | 187 | 413 | 23 | 93 | 78 | v1.0-legacy | 1.4 |  |
| catalog-2017-11.json | 2017 (Legacy) | 187 | 401 | 23 | 96 | 81 | v1.0-legacy | 1.4 |  |
| catalog-2017-10.json | 2017 (Legacy) | 187 | 400 | 23 | 97 | 82 | v1.0-legacy | 1.4 |  |
| catalog-2017-09.json | 2017 (Legacy) | 186 | 396 | 24 | 96 | 82 | v1.0-legacy | 1.4 |  |
| catalog-2017-08.json | 2017 (Legacy) | 187 | 396 | 25 | 96 | 82 | v1.0-legacy | 1.4 |  |
| catalog-2017-07.json | 2017 (Legacy) | 185 | 393 | 25 | 96 | 82 | v1.0-legacy | 1.4 |  |
| catalog-2017-05.json | 2017 (Legacy) | 189 | 334 | 28 | 95 | 81 | v1.0-legacy | 1.4 |  |
| catalog-2017-03.json | 2017 (Legacy) | 190 | 329 | 28 | 95 | 82 | v1.0-legacy | 1.4 |  |
| catalog-2017-01.json | 2017 (Legacy) | 203 | 417 | 26 | 100 | 71 | v1.0-legacy | 1.6 |  |
