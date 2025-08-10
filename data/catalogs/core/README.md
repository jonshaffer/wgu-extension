# WGU Catalog Testing Framework

This directory contains a comprehensive testing framework for validating WGU catalog parsing output across different parser versions and catalog formats.

## Overview

The testing framework ensures data quality and consistency across:
- **Multiple parser versions** (v1.0 for legacy, v2.0 for modern)
- **Different catalog formats** (2017-2020 vs 2021+ catalogs)  
- **Various data quality metrics** (CCN coverage, course completeness, etc.)
- **Automated catalog downloads** from WGU website
- **Full pipeline automation** (download → parse → test)

## Files Structure

```
data/catalogs/
├── catalog-tester.ts         # Core testing framework
├── run-tests.ts              # CLI test runner
├── generate-samples.ts       # Sample data generator
├── catalog-downloader.ts     # WGU website catalog downloader
├── download-catalogs.ts      # Download CLI interface
├── catalog-pipeline.ts       # Full automation pipeline
├── README.md                # This file
├── *.pdf                    # Downloaded catalog files
└── *-parsed.json            # Parsed catalog files (generated)
```

## Quick Start

### 🚀 Full Automated Pipeline
```bash
# Download latest catalog, parse it, and test results
npm run catalog:pipeline

# Download and process all available catalogs
npm run catalog:pipeline -- --all

# Process specific year with comparison
npm run catalog:pipeline -- --year 2024
```

### 📥 Manual Catalog Downloads
```bash
# Download latest catalog
npm run catalog:download

# Download all known catalogs (2017-2025)
npm run catalog:download -- --all

# Download specific year
npm run catalog:download -- --year 2024

# Download legacy catalogs only (pre-2021)
npm run catalog:download -- --legacy

# Show what's been downloaded
npm run catalog:summary
```

### 🧪 Testing & Analysis
```bash
# Test all parsed catalogs
npm run test:catalog

# Compare catalog versions side-by-side
npm run test:catalog:compare

# Generate sample test data
npm run test:catalog:generate
```

## Catalog Download Features

### 📋 Available Catalogs
The framework automatically downloads from WGU's institutional catalog archive:

**Current Catalogs (2021+)**:
- August 2025 (Latest)
- January 2025
- October 2024
- May 2024
- September 2023

**Legacy Catalogs (Pre-2021)**:
- September 2019
- January 2017

### 🔍 Auto-Discovery
```bash
# Discover unknown catalogs for a specific year
npm run catalog:download -- --discover 2022

# List all known catalogs in registry
npm run catalog:download -- --list
```

### ⚙️ Pipeline Workflows

**Latest Catalog Workflow**:
1. 📥 Downloads current WGU catalog (August 2025)
2. 🔧 Auto-detects format and uses v2.0 parser
3. 🧪 Runs comprehensive quality tests
4. 📊 Provides detailed analysis and recommendations

**Full Archive Workflow**:
1. 📥 Downloads all available catalogs (2017-2025)
2. 🔧 Auto-selects appropriate parser for each (v1.0 for legacy, v2.0 for modern)
3. 🧪 Tests and compares all versions
4. 📈 Generates trend analysis across format changes

**Comparison Workflow**:
1. 📥 Downloads latest + legacy catalogs
2. 🔧 Parses with version-appropriate parsers
3. 🧪 Runs side-by-side comparison tests
4. 📊 Highlights format evolution and data quality differences
- ✅ Validates required top-level properties (`courses`, `degreePlans`, `metadata`)
- ⚠️ Checks metadata completeness
- 🚨 Identifies critical structural issues

### 2. Course Data Quality (Weighted Scoring)
- **CCN Coverage** (25 pts): Percentage of courses with valid CCNs
- **Competency Units** (25 pts): Courses with valid CU values (1-10)
- **Course Names** (20 pts): Courses with proper names (not "undefined")
- **Descriptions** (20 pts): Courses with meaningful descriptions
- **Valid Course Codes** (10 pts): Proper course code format validation

**Scoring**: 90%+ CCN coverage gets full points, scales down from there.

### 3. Course Code Pattern Analysis
- Identifies course code patterns: `C123`, `ABC12`, `AB123C`, etc.
- Flags non-standard patterns as warnings
- **Pass Threshold**: <5% invalid course codes

### 4. CCN Format Validation  
- Standard format: `SUBJ 1234`
- Variant formats: `SUBJ 123`, `SUBJ 12345`
- **Pass Threshold**: 95%+ valid CCN formats

### 5. Degree Plan Quality
- Validates degree plan structure and completeness
- Checks for course lists, total CUs, degree names
- **Pass Threshold**: 60% average across metrics

### 6. Parser Performance
- Processing time analysis
- Error count validation
- Statistics availability check
- **Pass Threshold**: 70% overall performance score

## Understanding Test Output

### Individual Test Results
```
✅ Course Data Quality
   Score: 96/100 (96%)
   CCN Coverage: 96% (803/830)
   Competency Units Coverage: 97% (806/830)
   Course Names Coverage: 100% (830/830)
   Description Coverage: 85% (705/830)
   Valid Course Codes: 99% (3 invalid)
   ⚠️  Low description coverage: 85%
```

### Comparison Table
```
Catalog              | Parser | Score | CCN% | CU% | Courses | Plans
perfect-catalog-2025 | v2.0   | 100%  | 100% | 100%| 100     | 1
catalog-2025-parsed  | v2.0   | 92%   | 96%  | 97% | 830     | 12
legacy-2017-parsed   | v1.0   | 78%   | 78%  | 100%| 78      | 0
```

## Quality Thresholds

| Metric | Excellent | Good | Warning | Poor |
|--------|-----------|------|---------|------|
| CCN Coverage | 95%+ | 85%+ | 70%+ | <70% |
| CU Coverage | 95%+ | 85%+ | 70%+ | <70% |
| Course Names | 98%+ | 90%+ | 80%+ | <80% |
| Descriptions | 90%+ | 75%+ | 60%+ | <60% |
| Overall Score | 90%+ | 80%+ | 70%+ | <70% |

## Common Issues & Solutions

### Low CCN Coverage
**Symptoms**: CCN Coverage below 85%
**Causes**: 
- Missing degree plan tables in PDF
- Changed CCN format in catalog
- Parser regex patterns need updating

**Solutions**:
1. Check if degree plan tables exist: `grep -i "degree.*plan" catalog.pdf` 
2. Update CCN extraction patterns in parser
3. Add manual CCN mappings to `known_mappings`

### Zero Competency Units
**Symptoms**: CU Coverage below 90%
**Causes**:
- Competency units listed as "0" in PDF
- Different CU format (e.g., "3 CUs" vs "3")
- Missing CU information entirely

**Solutions**:
1. Update CU extraction regex: `\\b(\\d+)\\s*(?:CU|competency\\s+unit|credit)`
2. Add fallback patterns for alternative formats
3. Check for embedded CU info in course descriptions

### Missing Descriptions
**Symptoms**: Description Coverage below 60%
**Causes**:
- Descriptions truncated during parsing
- Different description format in catalog
- Descriptions embedded in different sections

**Solutions**:
1. Increase context window in description extraction
2. Check for descriptions in adjacent paragraphs
3. Consider parsing Student Policy Handbook for enhanced descriptions

### Parser Performance Issues
**Symptoms**: Processing time >5 seconds, high error count
**Causes**:
- Large PDF files
- Complex text layouts
- Memory limitations

**Solutions**:
1. Optimize regex patterns for efficiency
2. Process PDFs in chunks
3. Cache intermediate results
4. Use streaming parsing for large files

## Integration with CI/CD

Add to GitHub Actions:

```yaml
- name: Test Catalog Quality
  run: |
    npm run test:catalog:compare
    # Fail if average score below 80%
    npm run test:catalog | grep "Average Score" | awk '{if($3 < 80) exit 1}'
```

## Extending the Framework

### Adding New Tests

1. **Create test method** in `CatalogTester` class:
```typescript
testCustomMetric(): TestResult {
  // Your validation logic
  return {
    testName: 'Custom Metric',
    passed: true,
    score: 85,
    maxScore: 100,
    details: ['Custom validation details'],
    warnings: [],
    errors: []
  };
}
```

2. **Add to test suite** in `runAllTests()`:
```typescript
this.results = [
  // ... existing tests
  this.testCustomMetric()
];
```

### Custom Quality Metrics

Example: Test for course prerequisite completeness
```typescript
testPrerequisiteQuality(): TestResult {
  const coursesWithPrereqs = Object.values(this.data.courses)
    .filter(course => course.prerequisites && course.prerequisites.length > 0);
  
  const prereqCoverage = Math.round((coursesWithPrereqs.length / totalCourses) * 100);
  
  return {
    testName: 'Prerequisite Coverage',
    passed: prereqCoverage >= 30, // 30% minimum
    score: Math.min(100, prereqCoverage * 2), // Scale to 100
    maxScore: 100,
    details: [`${prereqCoverage}% of courses have prerequisites`],
    warnings: prereqCoverage < 20 ? ['Very low prerequisite coverage'] : [],
    errors: []
  };
}
```

## Performance Monitoring

Track parser performance over time:

```bash
# Run tests and save results with timestamp
npm run test:catalog --compare > "results-$(date +%Y%m%d).txt"

# Compare with previous results
diff results-20241201.txt results-20241215.txt
```

## Troubleshooting

### Test Runner Errors

**"No parsed catalog files found"**
- Run catalog ingestion first: `npm run data:ingest:catalog`
- Check if files exist: `ls data/catalogs/*-parsed.json`

**TypeScript compilation errors**
- Update types: `npm run compile`
- Check catalog-data.ts interface compatibility

**Memory issues with large catalogs**
- Increase Node.js memory: `node --max-old-space-size=4096`
- Process catalogs individually instead of all at once

### Parser Issues

**CCN extraction fails completely**
- Verify PDF text extraction: `pdftotext catalog.pdf - | head -100`
- Check for embedded fonts or image-based text
- Try different PDF parsing libraries

**Degree plan extraction returns empty**
- Search for table patterns: `pdftotext catalog.pdf - | grep -i "degree\|bachelor\|master"`
- Check if degree plans are in separate document
- Verify table detection regex patterns

## Future Enhancements

- **Visual diff reports** for catalog changes over time
- **Integration testing** with browser extension
- **Performance regression detection**
- **Automated quality trend analysis**
- **Multi-format catalog support** (HTML, XML)
- **Real-time catalog monitoring** from WGU website
