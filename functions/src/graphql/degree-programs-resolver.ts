import {getDegreeProgramWithCourses} from "../lib/data-queries.js";
import {db} from "../lib/firebase.js";
import {DegreeProgram, COLLECTIONS, Course} from "../lib/data-model.js";

interface DegreeProgramsArgs {
  college?: string;
  level?: string;
  limit?: number;
}

interface DegreeProgramResult {
  id: string;
  code: string;
  name: string;
  college: string;
  level: string;
  totalUnits: number;
  courseCodes: string[];
}

export async function degreeProgramsResolver(
  _parent: unknown,
  args: DegreeProgramsArgs
): Promise<{ items: DegreeProgramResult[]; totalCount: number }> {
  const {college, level, limit = 50} = args;

  try {
    let query = db.collection(COLLECTIONS.DEGREE_PROGRAMS) as any;

    if (college) {
      query = query.where("college", "==", college);
    }
    if (level) {
      query = query.where("level", "==", level);
    }

    const snapshot = await query.limit(limit).get();

    const items: DegreeProgramResult[] = [];

    snapshot.forEach((doc: any) => {
      const program = doc.data() as DegreeProgram;
      items.push({
        id: doc.id,
        code: program.code,
        name: program.name,
        college: program.college,
        level: program.level,
        totalUnits: program.totalUnits,
        courseCodes: program.courses.map((c) => c.courseCode),
      });
    });

    // If no results from the new collection, try the legacy format
    if (items.length === 0) {
      // Try legacy academic-registry format
      const legacyDoc = await db.collection("academic-registry").doc("degree-programs").get();
      if (legacyDoc.exists) {
        const data = legacyDoc.data() || {};
        const programs = data.programs || {};

        for (const [id, program] of Object.entries(programs)) {
          const p = program as any;

          // Apply filters
          if (college && p.college !== college) continue;
          if (level && p.degreeType !== level) continue;

          items.push({
            id: p.code || id,
            code: p.code || id,
            name: p.name || "",
            college: p.college || "",
            level: p.degreeType || "bachelor",
            totalUnits: p.totalCUs || 0,
            courseCodes: [], // Legacy format doesn't have course list
          });

          if (items.length >= limit) break;
        }
      }
    }

    return {
      items,
      totalCount: items.length,
    };
  } catch (error) {
    console.error("Error in degreeProgramsResolver:", error);
    return {
      items: [],
      totalCount: 0,
    };
  }
}

// Resolver for degree program associations
export async function degreeProgramCoursesResolver(parent: DegreeProgramResult) {
  try {
    const result = await getDegreeProgramWithCourses(parent.id);
    if (!result) return [];

    return result.courses.map((course) => ({
      code: course.courseCode,
      name: course.name,
      competencyUnits: course.units,
      description: course.description,
    }));
  } catch (error) {
    console.error(`Error fetching courses for degree ${parent.id}:`, error);
    // Fall back to course codes if available
    if (parent.courseCodes && parent.courseCodes.length > 0) {
      const {getCoursesByIds} = await import("../lib/data-queries.js");
      const courses = await getCoursesByIds(parent.courseCodes);
      return courses.map((course: Course) => ({
        code: course.courseCode,
        name: course.name,
        competencyUnits: course.units,
        description: course.description,
      }));
    }
    return [];
  }
}
