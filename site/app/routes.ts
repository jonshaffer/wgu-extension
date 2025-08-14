import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("suggest", "routes/suggest.tsx"),
  
  // Course routes
  route("courses", "routes/courses/index.tsx"),
  route("courses/:courseCode", "routes/courses/details.tsx"),
  
  // Discord routes
  route("discord", "routes/discord/index.tsx"),
  route("discord/:serverId", "routes/discord/details.tsx"),
  
  // Reddit routes
  route("reddit", "routes/reddit/index.tsx"),
  route("reddit/:subredditName", "routes/reddit/details.tsx"),
  
  // WGU Connect routes
  route("wgu-connect", "routes/wgu-connect/index.tsx"),
  route("wgu-connect/:groupId", "routes/wgu-connect/details.tsx"),
  
  // Degree Plans routes
  route("degree-plans", "routes/degree-plans/index.tsx"),
  route("degree-plans/:degreeId", "routes/degree-plans/details.tsx"),
  
  // Student Groups routes
  route("student-groups", "routes/student-groups/index.tsx"),
  route("student-groups/:studentGroupId", "routes/student-groups/details.tsx"),
  
  // Docs routes
  route("docs", "routes/docs/index.tsx"),
  route("docs/search-syntax", "routes/docs/search-syntax.tsx"),
  route("docs/privacy", "routes/docs/privacy.tsx"),
  route("docs/style-guide", "routes/docs/style-guide.tsx"),
  
  // Admin routes
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/dashboard.tsx"),
    route("suggestions", "routes/admin/suggestions.tsx"),
    route("login", "routes/admin/login.tsx")
  ])
] satisfies RouteConfig;
