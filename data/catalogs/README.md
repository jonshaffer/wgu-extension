# WGU Catalog Parser

## 📋 Overview

Production-ready system for extracting, parsing, and maintaining Western Governors University's academic catalog data. Provides both historical catalog preservation (2017-) and live catalog monitoring capabilities.

## 📁 Directory Structure

 `pdfs/` - Catalog PDF files
 `parsed/` - Processed JSON catalog data (DVC-managed)
 `scripts/` - Callable parsing/ingestion scripts (moved from core)
 `types/` - Canonical TypeScript types and JSON Schema (catalog-data.ts, catalog-data.schema.json)

## ⚠️ Important: Data Version Control (DVC)

The parsed catalog JSON files are large (several MB each) and are managed with DVC (Data Version Control). They are stored in Google Drive and must be pulled before use.

### Before Running Any Scripts

```bash
# Pull catalog files from DVC
dvc pull data/catalogs/parsed/

# Or use the ensure script
npm run catalog:ensure
```

### Why DVC?

- **Git Performance**: Keeps Git repository fast by storing large files externally
- **Version Control**: Still tracks file versions and changes
- **Collaboration**: Easy sharing of large datasets
- **Storage**: Free 15GB Google Drive storage for all large files

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

> 🚀 **Enhanced Parser**: Now extracts **program learning outcomes** and **certificate information** in addition to courses and degree plans.

### Recent Catalogs (Latest 20)

**Legend**: *Outcomes* = Program learning outcomes | *Certs* = Certificate programs | *Enhanced* = ✅ includes new parser features | ⚠️ = Quality alert

| File | Date | Pages | Courses | Plans | Outcomes | Certs | CCN% | CU% | Parser | Enhanced |
|------|------|-------|---------|-------|----------|-------|------:|----:|--------|----------|
| catalog-2025-08.json | 2025 (Current) | 355 | 829 | 180 | 84 | 0 | 93% | 66% | v2.1-enh | ✅ |
| catalog-2025-07.json | 2025 (Current) | 357 | 826 | 185 | 0 | 0 | 94% | 66% | v2.1 |  |
| catalog-2025-06.json | 2025 (Current) | 348 | 819 | 185 | 0 | 0 | 94% | 63% | v2.1 |  |
| catalog-2025-05.json | 2025 (Current) | 343 | 812 | 186 | 0 | 0 | 94% | 63% | v2.1 |  |
| catalog-2025-04.json | 2025 (Current) | 342 | 812 | 185 | 0 | 0 | 94% | 63% | v2.1 |  |
| catalog-2025-03.json | 2025 (Current) | 341 | 810 | 185 | 0 | 0 | 95% | 63% | v2.1 |  |
| catalog-2025-02.json | 2025 (Current) | 352 | 861 | 192 | 0 | 0 | 95% | 62% | v2.1 |  |
| catalog-2025-01.json | 2025 (Current) | 329 | 789 | 170 | 0 | 0 | 95% | 61% | v2.1 |  |
| catalog-2024-12.json | 2024 (Current) | 327 | 781 | 171 | 0 | 0 | 95% | 61% | v2.1 |  |
| catalog-2024-11.json | 2024 (Current) | 325 | 780 | 167 | 0 | 0 | 95% | 61% | v2.1 |  |
| catalog-2024-10.json | 2024 (Current) | 325 | 778 | 165 | 0 | 0 | 95% | 61% | v2.1 |  |
| catalog-2024-09.json | 2024 (Current) | 321 | 785 | 161 | 0 | 0 | 96% | 61% | v2.1 |  |
| catalog-2024-08.json | 2024 (Current) | 267 | 741 | 157 | 0 | 0 | 95% | 62% | v2.1 |  |
| catalog-2024-07.json | 2024 (Current) | 261 | 751 | 146 | 0 | 0 | 89%⚠️ | 60% | v2.1 |  |
| catalog-2024-06.json | 2024 (Current) | 254 | 693 | 143 | 0 | 0 | 96% | 64% | v2.1 |  |
| catalog-2024-05.json | 2024 (Current) | 246 | 678 | 140 | 0 | 0 | 95% | 63% | v2.1 |  |
| catalog-2024-04.json | 2024 (Current) | 246 | 678 | 140 | 0 | 0 | 95% | 63% | v2.1 |  |
| catalog-2024-03.json | 2024 (Current) | 245 | 676 | 137 | 0 | 0 | 95% | 62% | v2.1 |  |
| catalog-2024-02.json | 2024 (Current) | 244 | 676 | 137 | 0 | 0 | 94% | 62% | v2.1 |  |
| catalog-2024-01.json | 2024 (Current) | 240 | 670 | 134 | 0 | 0 | 92% | 62% | v2.1 |  |

### Latest Enhancements ✨
- **Program Outcomes**: 84 learning outcomes extracted from enhanced catalogs
- **Enhanced Course Codes**: Support for certificate-specific formats (PACA101, UTH, DCADA, etc.)
- **Quality Maintained**: 95% CCN coverage, 62% CU coverage across all catalogs

### Summary Statistics
- **Total Catalogs**: 101 (2017-2025)
- **Total Courses**: 59,132
- **Unique Courses**: 1,605
- **Degree Plans**: 12,530  
- **Program Outcomes**: 84 ✨ *NEW*
- **Enhanced Catalogs**: 1/101

### Quality Metrics
- **CCN Coverage**: 95% ✅ *(Target: ≥90%)*
- **CU Coverage**: 62% ✅ *(Target: ≥60%)*
- **Complete Records**: 97% *(Code + Name + Description)*

### Usage Examples
```typescript
// Load enhanced catalog data
const catalog = JSON.parse(fs.readFileSync('parsed/catalog-2025-08.json'));

// Access program outcomes (NEW!)
const accountingOutcomes = catalog.programOutcomes['B.S. Accounting'];
console.log(accountingOutcomes.outcomes.length); // 5 learning outcomes

// Traditional course data (maintained)
const course = catalog.courses['C182'];
console.log(course.courseName, course.ccn, course.competencyUnits);
```

*Updated: 2025-08-12 | Enhanced Parser: v2.1-enh*
