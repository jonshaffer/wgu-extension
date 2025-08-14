import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { Container } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ArrowRight, Search, Shield, Code, Users, BookOpen } from 'lucide-react';

export function meta() {
  return [
    { title: "Documentation - WGU Extension" },
    { name: "description", content: "Documentation for the WGU Extension - search syntax, privacy policy, and developer guides" },
  ];
}

export default function DocsIndex() {
  const sections = [
    {
      title: "Search Syntax",
      description: "Learn how to use advanced search operators and filters",
      icon: Search,
      href: "/docs/search-syntax",
      color: "text-blue-500"
    },
    {
      title: "Privacy Policy",
      description: "Our commitment to protecting your data and privacy",
      icon: Shield,
      href: "/docs/privacy",
      color: "text-green-500"
    },
    {
      title: "API Reference",
      description: "GraphQL API documentation for developers",
      icon: Code,
      href: "/docs/api",
      color: "text-purple-500"
    },
    {
      title: "Style Guide",
      description: "Design system and brand guidelines for WGU Extension",
      icon: Users,
      href: "/docs/style-guide",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Container className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <BookOpen className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using the WGU Extension and its features
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <Link to={section.href} className="block h-full">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 ${section.color}`}>
                      <section.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        {section.title}
                        <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Check out our community resources or get in touch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/search?q=help">Search Community</Link>
            </Button>
            <Button asChild>
              <a href="https://github.com/jonshaffer/wgu-extension/issues" target="_blank" rel="noopener noreferrer">
                Report an Issue
              </a>
            </Button>
          </div>
        </motion.div>
      </Container>
      <Footer />
    </div>
  );
}