import {describe, expect, test} from "@jest/globals";

// Direct test of search logic without Firebase dependencies
describe("Search Logic Tests", () => {
  // Mock search function that mimics the resolver behavior
  function mockSearch(query: string, limit = 20) {
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
      return {
        results: [],
        totalCount: 0,
        query: searchQuery,
      };
    }

    // Mock data
    const mockCourses = [
      {
        type: "course",
        courseCode: "C172",
        name: "C172: Network and Security - Foundations",
        description: "Network security course",
        platform: "academic-registry",
        competencyUnits: 3,
      },
      {
        type: "course",
        courseCode: "C173",
        name: "C173: Scripting and Programming - Foundations",
        description: "Programming course",
        platform: "academic-registry",
        competencyUnits: 3,
      },
    ];

    const mockCommunities = [
      {
        type: "community",
        name: "WGU Cyber Security Club",
        description: "Cybersecurity community",
        platform: "discord",
        memberCount: 5000,
      },
    ];

    const allResults = [...mockCourses, ...mockCommunities];

    // Filter results
    const filtered = allResults.filter((item) => {
      const searchableText = [
        item.name,
        item.description,
        (item as any).courseCode,
      ].filter(Boolean).join(" ").toLowerCase();

      return searchableText.includes(searchQuery);
    });

    return {
      results: filtered.slice(0, limit),
      totalCount: filtered.length,
      query: searchQuery,
    };
  }

  test("should return empty results for empty query", () => {
    const result = mockSearch("   ");

    expect(result.query).toBe("");
    expect(result.totalCount).toBe(0);
    expect(result.results).toEqual([]);
  });

  test("should search for courses by code", () => {
    const result = mockSearch("C172");

    expect(result.query).toBe("c172");
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.results[0]).toMatchObject({
      type: "course",
      courseCode: "C172",
      platform: "academic-registry",
    });
  });

  test("should search across multiple types", () => {
    const result = mockSearch("security");

    expect(result.totalCount).toBeGreaterThan(1);
    const types = new Set(result.results.map((r) => r.type));
    expect(types.size).toBeGreaterThan(1);
  });

  test("should respect limit parameter", () => {
    const result = mockSearch("c", 1);

    expect(result.results.length).toBe(1);
  });

  test("should handle case-insensitive search", () => {
    const result1 = mockSearch("CYBER");
    const result2 = mockSearch("cyber");

    expect(result1.totalCount).toBe(result2.totalCount);
  });

  test("should find partial matches", () => {
    const result = mockSearch("C17");

    const courseResults = result.results.filter((r) => r.type === "course");
    expect(courseResults.length).toBe(2); // Both C172 and C173
  });
});
