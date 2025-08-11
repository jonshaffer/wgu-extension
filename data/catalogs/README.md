# WGU Catalog Parser

## 📋 Overview

Production-ready system for extracting, parsing, and maintaining Western Governors University's academic catalog data. Provides both historical catalog preservation (2017-2025) and live catalog monitoring capabilities.

## 📁 Directory Structure

- `raw/` - Raw catalog files for testing and development
- `historical/` - Complete historical catalog collection (2017-2025)
  - `pdfs/` - 101+ catalog PDF files via Git LFS
  - `parsed/` - Processed JSON catalog data
- `core/` - Core parsing infrastructure and utilities
- `scripts/` - Processing and ingestion scripts
- `catalog-data.ts` - TypeScript type definitions

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
npx tsx core/fetch-current-catalog.ts

# Parse only (if already downloaded)
npx tsx core/fetch-current-catalog.ts --parse-only

# Test existing parsed data
npx tsx core/fetch-current-catalog.ts --test-only
```

### Analyze Data Quality
```bash
# Comprehensive analysis of all parsed catalogs
npx tsx core/analyze-parsing-state.ts
```

### Parse Historical Catalogs
```bash
# Parse a specific catalog
npx tsx core/catalog-parser-unified.ts pdfs/catalog-2024-10.pdf

# Batch parse all catalogs
npx tsx scripts/batch-parse-all.ts
```

## 📁 Directory Structure

```
data/catalogs/
├── README.md                           # This file
│
├── core/                               # Core parsing engine
│   ├── catalog-parser-unified.ts       # Main parser (770 lines)
│   ├── analyze-parsing-state.ts        # Data quality analysis
│   ├── fetch-current-catalog.ts        # Live catalog fetcher
│   └── README.md                       # Core documentation
│
├── historical/                         # Historical data (2017-2025)
│   ├── pdfs/                          # 117 original PDF catalogs
│   └── parsed/                         # 117 processed JSON files
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

### 1. Unified Parser (`core/catalog-parser-unified.ts`)
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
npx tsx core/catalog-parser-unified.ts path/to/catalog.pdf
```

### 2. Live Catalog Fetcher (`core/fetch-current-catalog.ts`)
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

### 3. Quality Analyzer (`core/analyze-parsing-state.ts`)
**Comprehensive data quality analysis and reporting**

**Metrics:**
- Course extraction success rates
- CCN/CU coverage analysis
- Year-over-year quality trends
- Data completeness scoring

## 📊 Data Quality Standards

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
npx tsx core/analyze-parsing-state.ts

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