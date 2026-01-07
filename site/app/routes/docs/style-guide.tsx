import React from "react";
import {Link} from "react-router";
import {motion} from "motion/react";
import {Navigation} from "../../components/Navigation";
import {Footer} from "../../components/Footer";
import {Container} from "~/components/ui/container";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {ArrowLeft, Palette, Eye, Type, Square} from "lucide-react";

export function meta() {
  return [
    {title: "Style Guide - WGU Extension Docs"},
    {name: "description", content: "Design system and style guide for the WGU Extension"},
  ];
}

export default function StyleGuide() {
  const colors = [
    {
      name: "Background",
      value: "#FFFFFF",
      description: "Primary background color - pure white",
      usage: "Main page backgrounds, card backgrounds",
    },
    {
      name: "Cream Accent",
      value: "#FDF9F5",
      description: "Secondary background - warm cream",
      usage: "Accent sections, muted backgrounds, hover states",
    },
    {
      name: "Dark Blue",
      value: "#2D3142",
      description: "Primary text and navigation",
      usage: "Headers, body text, navigation elements",
    },
    {
      name: "Forest Green",
      value: "#335142",
      description: "Secondary accent color",
      usage: "Secondary buttons, highlights, borders",
    },
    {
      name: "Crimson Red",
      value: "#931621",
      description: "Primary brand color",
      usage: "Primary buttons, links, brand elements",
    },
    {
      name: "Golden Brown",
      value: "#7D5024",
      description: "Tertiary accent color",
      usage: "Warning states, badges, subtle accents",
    },
  ];

  const components = [
    {
      name: "Buttons",
      examples: [
        {variant: "default", label: "Primary Button"},
        {variant: "secondary", label: "Secondary Button"},
        {variant: "outline", label: "Outline Button"},
        {variant: "ghost", label: "Ghost Button"},
        {variant: "link", label: "Link Button"},
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Container className="py-8">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/docs">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Style Guide</h1>
              <p className="text-muted-foreground">Design system and brand guidelines for WGU Extension</p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Brand Colors */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Palette className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Brand Colors</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colors.map((color) => (
                  <Card key={color.name} className="p-6">
                    <div className="space-y-4">
                      <div
                        className="w-full h-20 rounded-lg border border-border shadow-sm"
                        style={{backgroundColor: color.value}}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{color.name}</h3>
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {color.value}
                        </code>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">{color.description}</p>
                        <p className="text-xs"><strong>Usage:</strong> {color.usage}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Typography */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Type className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Typography</h2>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
                    <code className="text-sm text-muted-foreground">text-4xl font-bold</code>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Heading 2</h2>
                    <code className="text-sm text-muted-foreground">text-3xl font-bold</code>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Heading 3</h3>
                    <code className="text-sm text-muted-foreground">text-2xl font-bold</code>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Heading 4</h4>
                    <code className="text-sm text-muted-foreground">text-xl font-semibold</code>
                  </div>
                  <div>
                    <p className="text-base mb-2">
                      Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    <code className="text-sm text-muted-foreground">text-base</code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Small text - Used for captions, metadata, and secondary information.
                    </p>
                    <code className="text-sm text-muted-foreground">text-sm text-muted-foreground</code>
                  </div>
                </div>
              </Card>
            </section>

            {/* Components */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Square className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Components</h2>
              </div>

              {/* Buttons */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Buttons</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="link">Link Button</Button>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Button variants available: default, secondary, outline, ghost, link</p>
                  </div>
                </Card>

                {/* Badges */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Badges</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default Badge</Badge>
                    <Badge variant="secondary">Secondary Badge</Badge>
                    <Badge variant="outline">Outline Badge</Badge>
                    <Badge variant="destructive">Destructive Badge</Badge>
                  </div>
                </Card>

                {/* Cards */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Cards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Card Title</h4>
                      <p className="text-sm text-muted-foreground">
                        This is a sample card component with some content to demonstrate the styling.
                      </p>
                    </Card>
                    <Card className="p-4 border-primary">
                      <h4 className="font-semibold mb-2">Highlighted Card</h4>
                      <p className="text-sm text-muted-foreground">
                        This card has a primary border to show importance or selection.
                      </p>
                    </Card>
                  </div>
                </Card>
              </div>
            </section>

            {/* Brand Guidelines */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Brand Guidelines</h2>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Color Usage</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>White (#FFFFFF):</strong> Primary background for all pages and cards</li>
                      <li>
                        • <strong>Cream (#FDF9F5):</strong>{" "}
                        Secondary background for accent sections and muted elements
                      </li>
                      <li>• <strong>Dark Blue (#2D3142):</strong> Primary text color and navigation elements</li>
                      <li>• <strong>Forest Green (#335142):</strong> Secondary actions and hover states</li>
                      <li>• <strong>Crimson Red (#931621):</strong> Primary brand color for CTAs and key elements</li>
                      <li>• <strong>Golden Brown (#7D5024):</strong> Accent color for badges and warnings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Typography Guidelines</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use Inter font family for all text</li>
                      <li>• Maintain proper hierarchy with consistent heading sizes</li>
                      <li>• Use muted foreground color for secondary text</li>
                      <li>• Keep line height comfortable for reading (1.5-1.7)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Component Guidelines</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use primary buttons for main actions, secondary for less important actions</li>
                      <li>• Cards should have subtle shadows and proper spacing</li>
                      <li>• Maintain consistent border radius (typically 0.5rem)</li>
                      <li>• Use appropriate color variants for different states and contexts</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </motion.div>
      </Container>
      <Footer />
    </div>
  );
}
