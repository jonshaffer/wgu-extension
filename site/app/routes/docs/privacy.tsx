import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { Container } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ArrowLeft, Shield, Lock, Database, Users, RefreshCw, Mail } from 'lucide-react';

export function meta() {
  return [
    { title: "Privacy Policy - WGU Extension" },
    { name: "description", content: "Privacy policy for the WGU Extension - we don't collect, store, or process any personal data" },
  ];
}

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "No Data Collection",
      icon: Database,
      content: "We do not collect, store, or process any personal data from users. The app functions entirely on your device without transmitting any information to external servers."
    },
    {
      title: "No Third-Party Services",
      icon: Users,
      content: "Our app does not use third-party analytics, advertisements, or tracking services. Your usage remains private and is not shared with any external entities."
    },
    {
      title: "Local Data Storage",
      icon: Lock,
      content: "Any data you enter into the app is stored locally on your device. We do not have access to this data, nor do we back it up to any external servers."
    },
    {
      title: "Security",
      icon: Shield,
      content: "Since no data is collected or transmitted, there are no security risks associated with sharing information through the app. However, we recommend that you take appropriate measures to secure your device."
    },
    {
      title: "Changes to This Privacy Policy",
      icon: RefreshCw,
      content: "If any changes are made to this policy, we will update this document accordingly. Continued use of the app after changes are made indicates your acceptance of the updated policy."
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
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Effective Date: April 12, 2025</p>
            </div>
          </div>

          <div className="max-w-4xl space-y-6">
            {/* Introduction */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Our Commitment to Privacy</h2>
                  <p className="text-muted-foreground">
                    WGU Extension is committed to protecting your privacy. This Privacy Policy explains 
                    how we handle your information when you use our browser extension and website.
                  </p>
                </div>
              </div>
            </Card>

            {/* Policy Sections */}
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <section.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{index + 1}. {section.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Contact Section */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-3">6. Contact Us</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this Privacy Policy, you can contact us at:
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:jon@hyperfluidsolutions.com">
                      jon@hyperfluidsolutions.com
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Agreement */}
            <Card className="p-6 bg-muted/50">
              <p className="text-center text-muted-foreground">
                <strong>By using WGU Extension, you agree to this Privacy Policy.</strong>
              </p>
            </Card>

            {/* Key Points Summary */}
            <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-400">
                Key Privacy Points
              </h3>
              <ul className="space-y-2 text-green-700 dark:text-green-300">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  No personal data collection
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  All data stays on your device
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  No external data transmission
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  No third-party tracking
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