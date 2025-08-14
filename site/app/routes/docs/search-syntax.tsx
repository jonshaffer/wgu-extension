import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { Container } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ArrowLeft, Search, Copy } from 'lucide-react';
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Search Syntax - WGU Extension Docs" },
    { name: "description", content: "Learn how to use advanced search operators and filters in the WGU Extension" },
  ];
}

export default function SearchSyntaxDocs() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const examples = [
    {
      query: 'type:course',
      description: 'Find all courses'
    },
    {
      query: 'platform:discord',
      description: 'Find Discord communities'
    },
    {
      query: 'type:course level:upper',
      description: 'Find upper-level courses'
    },
    {
      query: 'college:IT units:>=3',
      description: 'Find IT courses with 3+ units'
    },
    {
      query: 'platform:discord members:>500',
      description: 'Find Discord servers with 500+ members'
    },
    {
      query: '"Data Structures" type:course',
      description: 'Find courses about Data Structures'
    },
    {
      query: 'code:C779 OR code:C777',
      description: 'Find specific course codes'
    },
    {
      query: '-type:course',
      description: 'Everything except courses'
    },
    {
      query: '(type:course OR type:degree) college:IT',
      description: 'Find IT courses or degrees'
    }
  ];

  const fields = [
    {
      name: 'type',
      values: 'course, degree, community, group',
      description: 'Filter by resource type'
    },
    {
      name: 'platform',
      values: 'discord, reddit, wgu-connect, student-groups',
      description: 'Filter by platform'
    },
    {
      name: 'code',
      values: 'C779, D194, etc.',
      description: 'Course code'
    },
    {
      name: 'level',
      values: 'upper, lower',
      description: 'Course level'
    },
    {
      name: 'units',
      values: 'number (3, 4, etc.)',
      description: 'Credit units (supports >, >=, <, <=)'
    },
    {
      name: 'college',
      values: 'IT, Business, Health, Education',
      description: 'College/school'
    },
    {
      name: 'degree',
      values: 'bachelor, master',
      description: 'Degree type'
    },
    {
      name: 'members',
      values: 'number',
      description: 'Community member count (supports >, >=, <, <=)'
    }
  ];

  const operators = [
    {
      operator: ':',
      description: 'Equals (default)',
      example: 'type:course'
    },
    {
      operator: ':>',
      description: 'Greater than',
      example: 'units:>3'
    },
    {
      operator: ':>=',
      description: 'Greater than or equal',
      example: 'members:>=500'
    },
    {
      operator: ':<',
      description: 'Less than',
      example: 'units:<4'
    },
    {
      operator: ':<=',
      description: 'Less than or equal',
      example: 'units:<=3'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Container className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/docs">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Search Syntax</h1>
              <p className="text-muted-foreground">Learn how to use advanced search operators and filters</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Search className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">How Search Works</h2>
                  <p className="text-muted-foreground mb-4">
                    The WGU Extension search supports powerful filtering using field:value syntax. 
                    You can combine text search with specific filters and logical operators to find exactly what you need.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-mono">
                      <span className="text-blue-600">type:course</span> <span className="text-gray-600">AND</span> <span className="text-green-600">"Data Structures"</span> <span className="text-gray-600">AND</span> <span className="text-purple-600">college:IT</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Find IT courses with "Data Structures" in the name
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Available Fields */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Available Fields</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.name} className="border rounded-lg p-4">
                    <div className="font-mono text-primary font-semibold">{field.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{field.description}</div>
                    <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2">
                      {field.values}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Comparison Operators */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Comparison Operators</h2>
              <div className="space-y-3">
                {operators.map((op) => (
                  <div key={op.operator} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-primary font-semibold min-w-[60px]">{op.operator}</span>
                      <span className="text-muted-foreground">{op.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{op.example}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(op.example)}
                        className="h-8 w-8"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Logical Operators */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Logical Operators</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary font-semibold min-w-[60px]">AND</span>
                    <span className="text-muted-foreground">Both conditions must be true (default)</span>
                  </div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">type:course level:upper</code>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary font-semibold min-w-[60px]">OR</span>
                    <span className="text-muted-foreground">Either condition can be true</span>
                  </div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">code:C779 OR code:C777</code>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary font-semibold min-w-[60px]">-</span>
                    <span className="text-muted-foreground">Exclude/negate (NOT)</span>
                  </div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">-type:course</code>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary font-semibold min-w-[60px]">( )</span>
                    <span className="text-muted-foreground">Group conditions</span>
                  </div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">(type:course OR type:degree) college:IT</code>
                </div>
              </div>
            </Card>

            {/* Examples */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Example Searches</h2>
              <div className="space-y-3">
                {examples.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="text-sm font-mono text-primary">{example.query}</code>
                      <div className="text-xs text-muted-foreground mt-1">{example.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(example.query)}
                        className="h-8 w-8"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/search?q=${encodeURIComponent(example.query)}`}>
                          Try it
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tips & Best Practices</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use quotes for exact phrases: <code className="bg-muted px-1 rounded">"Data Structures"</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Combine text and filters: <code className="bg-muted px-1 rounded">Python type:course</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use parentheses for complex logic: <code className="bg-muted px-1 rounded">(type:course OR type:degree) college:IT</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Fields are case-insensitive: <code className="bg-muted px-1 rounded">TYPE:COURSE</code> works the same as <code className="bg-muted px-1 rounded">type:course</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Start simple and add filters as needed to narrow down results
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      </Container>
      <Footer />
    </div>
  );
}