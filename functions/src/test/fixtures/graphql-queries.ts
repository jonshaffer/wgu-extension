export const SEARCH_QUERIES = {
  searchByCourseCode: `
    query SearchByCourseCode($query: String!, $limit: Int) {
      search(query: $query, limit: $limit) {
        query
        totalCount
        results {
          type
          name
          description
          courseCode
          platform
          competencyUnits
        }
      }
    }
  `,

  searchAcrossCollections: `
    query SearchAcrossCollections($query: String!, $limit: Int) {
      search(query: $query, limit: $limit) {
        query
        totalCount
        results {
          type
          name
          description
          platform
          url
          memberCount
        }
      }
    }
  `,

  searchDegreePrograms: `
    query SearchDegreePrograms($query: String!) {
      search(query: $query) {
        query
        totalCount
        results {
          type
          name
          description
          platform
          college
          degreeType
          competencyUnits
        }
      }
    }
  `,

  searchCommunities: `
    query SearchCommunities($query: String!, $limit: Int) {
      search(query: $query, limit: $limit) {
        query
        totalCount
        results {
          type
          name
          description
          platform
          url
          icon
          memberCount
        }
      }
    }
  `,

  searchWithAllFields: `
    query SearchWithAllFields($query: String!) {
      search(query: $query) {
        query
        totalCount
        results {
          type
          courseCode
          name
          url
          description
          icon
          platform
          memberCount
          competencyUnits
          college
          degreeType
        }
      }
    }
  `,
};

export const SEARCH_VARIABLES = {
  courseSearch: {
    query: "C172",
    limit: 10,
  },
  
  networkSearch: {
    query: "network",
    limit: 20,
  },
  
  degreeSearch: {
    query: "computer science",
  },
  
  communitySearch: {
    query: "cyber",
    limit: 15,
  },
  
  emptySearch: {
    query: "xyzabc123notfound",
  },
  
  broadSearch: {
    query: "a",
    limit: 5,
  },
};