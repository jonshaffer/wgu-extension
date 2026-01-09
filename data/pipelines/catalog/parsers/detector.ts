/**
 * Catalog Format Detector
 *
 * Detects which parser version to use based on PDF characteristics.
 * This separation allows us to add new parsers without modifying existing ones.
 */

import {createRequire} from "module";
import fs from "fs/promises";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export interface CatalogFormat {
  version: string;
  strategy: string;
  parserModule: string;
  characteristics: {
    yearRange: [number, number];
    contentPatterns: string[];
    tableFormat: string;
  };
}

// Define all known catalog formats
export const CATALOG_FORMATS: CatalogFormat[] = [
  {
    version: "v1.0",
    strategy: "embedded-ccn",
    parserModule: "./v1-embedded-ccn.ts",
    characteristics: {
      yearRange: [2017, 2020],
      contentPatterns: [
        "embedded CCN in course descriptions",
        "inline course codes without tables",
      ],
      tableFormat: "minimal",
    },
  },
  {
    version: "v2.0",
    strategy: "structured-tables",
    parserModule: "./v2-structured-tables.ts",
    characteristics: {
      yearRange: [2021, 2023],
      contentPatterns: [
        "CCN in dedicated tables",
        "structured degree plan tables",
        "clear course/CCN separation",
      ],
      tableFormat: "structured",
    },
  },
  {
    version: "v2.1",
    strategy: "enhanced-structured",
    parserModule: "./v2.1-enhanced-structured.ts",
    characteristics: {
      yearRange: [2024, 2030], // Future-proof
      contentPatterns: [
        "enhanced table formatting",
        "program outcomes section",
        "standalone courses section",
        "certificate programs with pricing",
      ],
      tableFormat: "enhanced",
    },
  },
];

export class CatalogFormatDetector {
  private filename: string;
  private year: number;
  private textSample: string = "";

  constructor(filename: string) {
    this.filename = filename;
    this.year = this.extractYear();
  }

  private extractYear(): number {
    const yearMatch = this.filename.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  }

  /**
   * Load a sample of the PDF to analyze format
   */
  async loadSample(filePath: string): Promise<void> {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer, {
      max: 10, // Only parse first 10 pages for detection
    });
    this.textSample = pdfData.text;
  }

  /**
   * Detect format based on year and content analysis
   */
  detect(): CatalogFormat {
    // First, try year-based detection
    for (const format of CATALOG_FORMATS) {
      const [minYear, maxYear] = format.characteristics.yearRange;
      if (this.year >= minYear && this.year <= maxYear) {
        // Verify with content patterns if sample is loaded
        if (this.textSample && this.verifyFormat(format)) {
          return format;
        } else if (!this.textSample) {
          // No sample loaded, trust year-based detection
          return format;
        }
      }
    }

    // Fallback to content-based detection
    if (this.textSample) {
      for (const format of CATALOG_FORMATS) {
        if (this.verifyFormat(format)) {
          return format;
        }
      }
    }

    // Default to most recent format
    return CATALOG_FORMATS[CATALOG_FORMATS.length - 1];
  }

  /**
   * Verify format matches content patterns
   */
  private verifyFormat(format: CatalogFormat): boolean {
    // Check for format-specific patterns
    switch (format.version) {
    case "v1.0":
      // Legacy format has CCN embedded in descriptions
      return /[A-Z]\d{3,4}[A-Z]?\s*\([A-Z]{2,4}\s+\d{3,5}\)/.test(this.textSample);

    case "v2.0":
      // Modern format has clear CCN tables
      return /CCN\s+Course\s+Number\s+Course\s+Description/.test(this.textSample);

    case "v2.1":
      // Enhanced format has program outcomes and standalone courses
      return /Program\s+Outcomes/.test(this.textSample) ||
               /Standalone\s+Courses/.test(this.textSample);

    default:
      return false;
    }
  }

  /**
   * Get detailed format info for logging
   */
  getFormatInfo(): string {
    const format = this.detect();
    return `
Catalog Format Detection:
  File: ${this.filename}
  Year: ${this.year}
  Detected Version: ${format.version}
  Strategy: ${format.strategy}
  Characteristics:
    - Year Range: ${format.characteristics.yearRange.join("-")}
    - Table Format: ${format.characteristics.tableFormat}
    - Patterns: ${format.characteristics.contentPatterns.join(", ")}
`;
  }
}

/**
 * Auto-detect and get appropriate parser
 */
export async function getParser(filename: string, filePath?: string) {
  const detector = new CatalogFormatDetector(filename);

  // Load sample if file path provided
  if (filePath) {
    await detector.loadSample(filePath);
  }

  const format = detector.detect();
  console.log(detector.getFormatInfo());

  // For now, return the unified parser
  // In future, we can split into separate parser modules
  const {CatalogParserUnified} = await import("./unified.js");
  return new CatalogParserUnified(filename);
}
