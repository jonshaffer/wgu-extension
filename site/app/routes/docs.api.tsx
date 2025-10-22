import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { Route } from './+types/docs.api';
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Container } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Code, ArrowRight, Zap, Lock, BookOpen } from 'lucide-react';

export function meta() {
  return [
    { title: "API Reference - Unofficial WGU Extension" },
    { name: "description", content: "GraphQL API documentation and interactive explorer for the Unofficial WGU Extension" },
  ];
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Container className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Code className="h-12 w-12 text-purple-500" />
              <h1 className="text-4xl font-bold">API Reference</h1>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
              <p className="text-xl text-muted-foreground">
                The Unofficial WGU Extension provides a GraphQL API for accessing community data, courses, and degree plans.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Zap className="h-6 w-6 text-purple-500" />
                      Interactive API Explorer
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      Try out our GraphQL API directly in your browser. Explore available queries, 
                      test requests, and see real-time responses with our interactive GraphiQL interface.
                    </p>
                    <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                      <Link to="/docs/api-explorer" className="flex items-center gap-2">
                        Launch API Explorer
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <Code className="h-24 w-24 text-purple-200 dark:text-purple-800 hidden md:block" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
            >
              <Card className="p-6">
                <Lock className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Public Access</h3>
                <p className="text-muted-foreground text-sm">
                  The API is publicly accessible with no authentication required for read operations.
                </p>
              </Card>
              <Card className="p-6">
                <BookOpen className="h-8 w-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">GraphQL Schema</h3>
                <p className="text-muted-foreground text-sm">
                  Full introspection support allows you to discover all available types and fields.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-4">Endpoint</h2>
                <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                  <code className="text-sm">
                    https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql
                  </code>
                </Card>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Available Queries</h2>
                <div className="space-y-4">
                  <Card className="p-6">
                    <h3 className="font-mono text-lg mb-2">courses</h3>
                    <p className="text-muted-foreground mb-3">
                      Retrieve a paginated list of WGU courses with details like course code, name, description, and units.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto">
                      <pre>{`query {
  courses(limit: 10, offset: 0) {
    items {
      courseCode
      name
      description
      units
    }
    totalCount
  }
}`}</pre>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-mono text-lg mb-2">search</h3>
                    <p className="text-muted-foreground mb-3">
                      Search across all community resources including Discord servers, Reddit communities, and WGU Connect groups.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto">
                      <pre>{`query {
  search(query: "C779", limit: 10) {
    results {
      type
      id
      title
      description
      url
    }
    totalCount
  }
}`}</pre>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-mono text-lg mb-2">degreePlans</h3>
                    <p className="text-muted-foreground mb-3">
                      Get information about WGU degree programs including required courses and total competency units.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto">
                      <pre>{`query {
  degreePlans(limit: 5) {
    items {
      id
      name
      description
      totalCUs
      courses
    }
    totalCount
  }
}`}</pre>
                    </div>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Using the API</h2>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">JavaScript/TypeScript</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm font-mono overflow-x-auto">
                    <pre>{`import { createClient } from '@wgu-extension/graphql-client';

const client = createClient();

// Get courses
const courses = await client.request(\`
  query GetCourses {
    courses(limit: 10) {
      items {
        courseCode
        name
      }
    }
  }
\`);`}</pre>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Container>
      <Footer />
    </div>
  );
}