/**
 * Courses Aggregator Library
 *
 * Aggregates course definitions across all parsed catalog JSON files
 * and produces a consolidated courses.json for downstream use.
 */

import {readFileSync, writeFileSync, readdirSync} from "fs";
import {resolve} from "path";

export interface CatalogCourse {
  courseCode: string;
  courseName: string;
  description?: string;
  ccn?: string;
  competencyUnits?: number;
}

export interface CatalogData {
  courses: Record<string, CatalogCourse>;
  metadata?: {
    catalogDate?: string;
    version?: string;
  };
}

export interface NormalizedCourse {
  id: string; // normalized key (lowercase code, e.g., "c182")
  code: string; // original course code (e.g., "C182")
  name: string; // course name/title
  description?: string; // optional description
  ccn?: string; // common course number
  competencyUnits?: number; // CU value when available
  catalogVersions: string[]; // list of catalog dates in which the course appears
  lastUpdated: string; // most recent catalog date encountered
}

export interface CoursesOutput {
  metadata: {
    generatedAt: string;
    totalCourses: number;
    catalogVersionsIncluded: string[];
    description: string;
  };
  courses: Record<string, NormalizedCourse>;
}

/**
 * Convert course code to normalized id (lowercase)
 */
export function normalizeCourseCode(code: string): string {
  return code.toLowerCase();
}

/**
 * Extract catalog date from filename
 */
export function getCatalogDate(filename: string): string {
  const match = filename.match(/catalog-(\d{4}-\d{2})\.json/);
  return match ? match[1] : filename.replace(".json", "");
}

/**
 * Aggregate courses from multiple catalog data objects
 */
export function aggregateCourses(
  catalogs: Map<string, CatalogData>
): Record<string, NormalizedCourse> {
  const courses = new Map<string, NormalizedCourse>();

  // Catalog keys are expected to be YYYY-MM; we will process in lexical order for chronological behavior
  const orderedCatalogs = Array.from(catalogs.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [catalogDate, catalog] of orderedCatalogs) {
    if (!catalog.courses) continue;

    for (const [code, course] of Object.entries(catalog.courses)) {
      const normalizedId = normalizeCourseCode(course.courseCode || code);

      if (courses.has(normalizedId)) {
        // Update existing course with latest info
        const existing = courses.get(normalizedId)!;
        existing.catalogVersions.push(catalogDate);
        existing.lastUpdated = catalogDate;

        // Prefer latest non-empty fields; keep name stable if missing
        if (course.courseName) existing.name = course.courseName;
        if (course.description && (!existing.description || course.description.length > existing.description.length)) {
          existing.description = course.description;
        }
        if (course.ccn) existing.ccn = course.ccn;
        if (typeof course.competencyUnits === "number") existing.competencyUnits = course.competencyUnits;
      } else {
        courses.set(normalizedId, {
          id: normalizedId,
          code: course.courseCode || code,
          name: course.courseName || code,
          description: course.description,
          ccn: course.ccn,
          competencyUnits: course.competencyUnits,
          catalogVersions: [catalogDate],
          lastUpdated: catalogDate,
        });
      }
    }
  }

  // Convert to sorted object by course code
  const sorted: Record<string, NormalizedCourse> = {};
  const keys = Array.from(courses.keys()).sort((a, b) => courses.get(a)!.code.localeCompare(courses.get(b)!.code));
  for (const k of keys) sorted[k] = courses.get(k)!;
  return sorted;
}

/**
 * Generate courses aggregate from all parsed catalogs
 */
export function generateCoursesAggregate(
  parsedDir: string,
  outputFile: string
): CoursesOutput {
  const catalogs = new Map<string, CatalogData>();

  // Load all parsed catalog files; only include catalog-YYYY-MM.json
  const files = readdirSync(parsedDir)
    .filter((f: string) => f.endsWith(".json") && /^catalog-\d{4}-\d{2}\.json$/.test(f))
    .sort();

  for (const file of files) {
    try {
      const filePath = resolve(parsedDir, file);
      const data = JSON.parse(readFileSync(filePath, "utf-8")) as CatalogData;
      const catalogDate = getCatalogDate(file);
      if (!data.metadata) data.metadata = {};
      data.metadata.catalogDate = catalogDate;
      catalogs.set(catalogDate, data);
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }

  if (catalogs.size === 0) {
    throw new Error("No catalog files found in parsed directory");
  }

  const courses = aggregateCourses(catalogs);

  const output: CoursesOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCourses: Object.keys(courses).length,
      catalogVersionsIncluded: Array.from(catalogs.keys()).sort(),
      description: "Aggregate WGU courses from all available catalog versions. Courses are keyed by normalized course codes (lowercase).",
    },
    courses,
  };

  writeFileSync(outputFile, JSON.stringify(output, null, 2) + "\n");
  return output;
}
