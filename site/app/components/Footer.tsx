import React from 'react';
import { Container } from '~/components/ui/container';
import { Logo } from './Logo';
import FooterNav from './FooterNav';
import { GitHubStarsButton } from './GitHubStarsButton';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo and Description */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <Logo size="lg" />
            <div className="max-w-md space-y-2">
              <p className="text-sm text-muted-foreground">
                Unofficial WGU Extension - Find community resources, Discord servers, and study groups for your WGU journey.
              </p>
              <p className="text-xs text-muted-foreground">
                Student-made tool. Not endorsed by WGU.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <FooterNav />

          {/* Bottom Section */}
          <div className="flex flex-col items-center space-y-4 pt-8 border-t border-border/40 w-full">
            <div className="flex items-center space-x-6">
              <GitHubStarsButton username="jonshaffer" repo="wgu-extension" />
              <div className="h-4 w-px bg-border" />
              <a
                href="mailto:jon@hyperfluidsolutions.com"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © {currentYear} Unofficial WGU Extension · MIT License · Made with ❤️ for the WGU community
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}