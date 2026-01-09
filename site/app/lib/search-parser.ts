import {parse} from "liqe";
import type {
  TagToken,
  ExpressionToken,
  LogicalExpressionToken,
  ParenthesizedExpressionToken,
  UnaryOperatorToken,
  LiteralExpressionToken,
  EmptyExpression,
  ParserAst,
  FieldToken,
} from "liqe";

// Define the fields we support
export const SEARCH_FIELDS = {
  // Resource type
  type: ["course", "degree", "community", "group"],

  // Platform
  platform: ["discord", "reddit", "wgu-connect", "student-groups"],

  // Course fields
  code: true, // Course code (e.g., C779)
  level: ["upper", "lower"],
  units: true, // Numeric
  prereq: true, // Prerequisite course code

  // Community fields
  members: true, // Numeric
  college: ["IT", "Business", "Health", "Education"],

  // Degree fields
  degree: ["bachelor", "master"],
  cus: true, // Total credit units - numeric

  // General fields
  tag: true, // Tags/categories
  name: true, // Resource name
} as const;

export interface SearchFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: string | number | string[];
}

export interface ParsedSearch {
  filters: SearchFilter[];
  text: string[]; // Free text search terms
  raw: string; // Original query
}

// Convert liqe AST to our filter format
function astToFilters(ast: ParserAst | ExpressionToken, filters: SearchFilter[] = [], text: string[] = []): void {
  switch (ast.type) {
  case "Tag": {
    // Handle field:value syntax
    const tagAst = ast as TagToken;
    if (tagAst.field.type === "ImplicitField") {
      // If no field is specified, treat as text search
      if (tagAst.expression.type === "LiteralExpression") {
        const literalValue = (tagAst.expression as LiteralExpressionToken).value;
        if (typeof literalValue === "string") {
          text.push(literalValue);
        }
      }
      break;
    }
    const field = (tagAst.field as FieldToken).name.toLowerCase();
    const value = tagAst.expression.type === "LiteralExpression" ?
      (tagAst.expression as LiteralExpressionToken).value :
      "";

    // Check if this is a supported field
    if (field in SEARCH_FIELDS) {
      // Handle different operators
      let operator: SearchFilter["operator"] = "eq";

      if (tagAst.operator.operator === ":") {
        operator = "eq";
      } else if (tagAst.operator.operator === ":>") {
        operator = "gt";
      } else if (tagAst.operator.operator === ":>=") {
        operator = "gte";
      } else if (tagAst.operator.operator === ":<") {
        operator = "lt";
      } else if (tagAst.operator.operator === ":<=") {
        operator = "lte";
      }

      // Convert value to our expected types
      let filterValue: string | number | string[];
      if (typeof value === "string") {
        filterValue = value.toLowerCase();
      } else if (typeof value === "number") {
        filterValue = value;
      } else if (value === true) {
        filterValue = "true";
      } else if (value === false) {
        filterValue = "false";
      } else {
        // null or other - skip this filter
        break;
      }

      filters.push({
        field,
        operator,
        value: filterValue,
      });
    }
    break;
  }

  case "LiteralExpression": {
    // Free text search
    const literalAst = ast as LiteralExpressionToken;
    if (typeof literalAst.value === "string") {
      text.push(literalAst.value);
    }
    break;
  }

  case "LogicalExpression": {
    // Handle AND/OR/NOT
    const logicalAst = ast as LogicalExpressionToken;
    if (logicalAst.operator.operator === "AND") {
      astToFilters(logicalAst.left, filters, text);
      astToFilters(logicalAst.right, filters, text);
    } else if (logicalAst.operator.operator === "OR") {
      // For OR, we need to handle this differently
      // For now, process both sides
      astToFilters(logicalAst.left, filters, text);
      astToFilters(logicalAst.right, filters, text);
    }
    break;
  }

  case "ParenthesizedExpression": {
    const parenAst = ast as ParenthesizedExpressionToken;
    astToFilters(parenAst.expression, filters, text);
    break;
  }

  case "UnaryOperator": {
    // Handle + and - operators
    const unaryAst = ast as UnaryOperatorToken;
    if (unaryAst.operator === "-") {
      const notFilters: SearchFilter[] = [];
      const notText: string[] = [];
      astToFilters(unaryAst.operand, notFilters, notText);

      // Convert to NOT filters
      notFilters.forEach((f) => {
        filters.push({
          ...f,
          operator: "ne",
        });
      });

      // Add NOT text
      notText.forEach((t) => {
        filters.push({
          field: "_text",
          operator: "ne",
          value: t,
        });
      });
    } else {
      astToFilters(unaryAst.operand, filters, text);
    }
    break;
  }

  case "EmptyExpression":
    // Handle empty expressions
    break;

  default:
    console.warn("Unhandled AST type:", ast.type);
  }
}

export function parseSearchQuery(query: string): ParsedSearch {
  try {
    // Parse with liqe
    const ast = parse(query);

    const filters: SearchFilter[] = [];
    const text: string[] = [];

    astToFilters(ast, filters, text);

    return {
      filters,
      text,
      raw: query,
    };
  } catch (error) {
    // If parsing fails, treat entire query as text search
    console.warn("Failed to parse query:", error);
    return {
      filters: [],
      text: [query],
      raw: query,
    };
  }
}

// Helper to convert parsed search to GraphQL variables
export function toGraphQLVariables(parsed: ParsedSearch) {
  const variables: Record<string, any> = {
    query: parsed.raw,
    filters: parsed.filters,
    textSearch: parsed.text.join(" "),
  };

  // Group filters by field for easier processing
  const filtersByField: Record<string, SearchFilter[]> = {};
  parsed.filters.forEach((filter) => {
    if (!filtersByField[filter.field]) {
      filtersByField[filter.field] = [];
    }
    filtersByField[filter.field].push(filter);
  });

  return {
    ...variables,
    filtersByField,
  };
}

// Examples of supported queries:
// type:course level:upper
// platform:discord members:>500
// code:C779 OR code:C777
// type:degree college:IT
// "Data Structures" type:course
// platform:(discord OR reddit) members:>=100
// -type:course (everything except courses)
// tag:python platform:discord
