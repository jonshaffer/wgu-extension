/**
 * V2.1 Enhanced Structured Parser
 *
 * Parser for catalogs from 2024 onwards with enhanced structure
 */

import {BaseCatalogParser} from "./base-parser";
import {CourseParser} from "./modules/course-parser";
import {DegreePlanParser} from "./modules/degree-plan-parser";
import {StandaloneParser} from "./modules/standalone-parser";
import {
  Course,
  DegreePlan,
  ParsedCatalog,
  StandaloneCourse,
  CertificateProgram,
  ProgramOutcome,
  CourseBundleInfo,
} from "../../_shared/types/catalog";
import {Logger} from "../../_shared/types/common";
import fs from "fs/promises";

export class V21EnhancedStructuredParser extends BaseCatalogParser {
  private courseParser: CourseParser;
  private degreePlanParser: DegreePlanParser;
  private standaloneParser: StandaloneParser;

  constructor(filename: string, logger?: Logger) {
    super(filename, logger);
    this.courseParser = new CourseParser(this.logger);
    this.degreePlanParser = new DegreePlanParser(this.logger);
    this.standaloneParser = new StandaloneParser(this.logger);
  }

  /**
   * Main parsing method
   */
  async parseCatalog(filePath: string, outputPath?: string): Promise<ParsedCatalog> {
    this.logger.info(`Starting V2.1 Enhanced parser for ${this.filename}`);

    // Load PDF
    await this.loadPDF(filePath);

    // Extract mappings
    const ccnMap = this.courseParser.extractCCNMappings(this.fullText);
    const cuMap = this.courseParser.extractCUMappings(this.fullText);
    const detailedDescriptions = this.courseParser.extractDetailedDescriptions(this.fullText);

    // Parse courses
    const coursesArray = this.parseCourses();

    // Parse degree plans
    const degreePlansArray = this.parseDegreePlans();

    // Parse enhanced content
    const {courses: standaloneCourses, bundles} = this.standaloneParser.parseStandaloneCourses(this.fullText);
    const certificatePrograms = this.standaloneParser.parseCertificatePrograms(this.fullText);
    const programOutcomes = this.standaloneParser.parseProgramOutcomes(this.fullText);

    // Convert arrays to objects
    const courses: Record<string, Course> = {};
    coursesArray.forEach((course) => {
      courses[course.courseCode] = course;
    });

    const degreePlans: Record<string, DegreePlan> = {};
    degreePlansArray.forEach((plan, index) => {
      const key = plan.code || plan.name.replace(/[^A-Za-z0-9]/g, "_");
      degreePlans[key] = plan;
    });

    // Build result
    const parsedCatalog: ParsedCatalog = {
      courses,
      degreePlans,
      standaloneCourses: Object.keys(standaloneCourses).length > 0 ? standaloneCourses : undefined,
      certificatePrograms: Object.keys(certificatePrograms).length > 0 ? certificatePrograms : undefined,
      programOutcomes: Object.keys(programOutcomes).length > 0 ? programOutcomes : undefined,
      courseBundles: bundles.length > 0 ? bundles : undefined,
      metadata: {
        catalogDate: this.extractCatalogDate(),
        parserVersion: "v2.1-enhanced",
        parsedAt: new Date().toISOString(),
        totalPages: this.totalPages,
        parsingTimeMs: Date.now() - this.startTime,
        pdf: this.pdfInfo,
        statistics: this.calculateStatistics(parsedCatalog),
        detectedPatterns: {
          courseCodeFormats: ["[A-Z]\\d{3,4}[A-Z]?"],
          ccnFormats: ["[A-Z]{2,4} \\d{3,5}[A-Z]?"],
          degreeTableFormats: ["enhanced-table"],
        },
      },
    };

    // Validate results
    const issues = this.validateResults(coursesArray, degreePlansArray);
    if (issues.length > 0) {
      this.logger.warn(`Validation found ${issues.length} issues`);
      issues.forEach((issue) => this.logger.warn(`  ${issue.severity}: ${issue.message}`));
    }

    // Save if output path provided
    if (outputPath) {
      await fs.mkdir(path.dirname(outputPath), {recursive: true});
      await fs.writeFile(outputPath, JSON.stringify(parsedCatalog, null, 2));
      this.logger.info(`Saved parsed catalog to ${outputPath}`);
    }

    return parsedCatalog;
  }

  /**
   * Parse courses using modern patterns
   */
  protected parseCourses(): Course[] {
    // Extract mappings
    const ccnMap = this.courseParser.extractCCNMappings(this.fullText);
    const cuMap = this.courseParser.extractCUMappings(this.fullText);
    const detailedDescriptions = this.courseParser.extractDetailedDescriptions(this.fullText);

    // Parse courses
    const courses = this.courseParser.parseCoursesModern(
      this.fullText,
      ccnMap,
      cuMap,
      detailedDescriptions,
      this.detectCourseType.bind(this)
    );

    // Deduplicate
    const seen = new Set<string>();
    const unique: Course[] = [];

    for (const course of courses) {
      if (!seen.has(course.courseCode)) {
        seen.add(course.courseCode);
        unique.push(course);
      }
    }

    return unique;
  }

  /**
   * Parse degree plans
   */
  protected parseDegreePlans(): DegreePlan[] {
    return this.degreePlanParser.parseDegreePlans(this.fullText);
  }

  /**
   * Extract catalog date from filename or content
   */
  private extractCatalogDate(): string {
    // Try filename first: catalog-2025-08.pdf
    const filenameMatch = this.filename.match(/(\d{4})-(\d{2})/);
    if (filenameMatch) {
      return `${filenameMatch[1]}-${filenameMatch[2]}`;
    }

    // Try content
    const contentMatch = this.fullText.match(/(?:Catalog|Copyright).*?(\d{4})/i);
    if (contentMatch) {
      return contentMatch[1];
    }

    return new Date().getFullYear().toString();
  }
}

// Export for use
export default V21EnhancedStructuredParser;
