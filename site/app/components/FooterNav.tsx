import * as React from "react";
import {Link} from "react-router";
import {ArrowUpRight} from "lucide-react";
import {cn} from "~/lib/utils";

type NavItem = {
  label: string;
  href: string;
  external?: boolean; // shows arrow and (optionally) opens in new tab
  internal?: boolean; // uses React Router Link instead of anchor
};

export type FooterNavProps = {
  className?: string;
  primary?: NavItem[];
  secondary?: NavItem[];
  openExternalInNewTab?: boolean;
};

const DEFAULT_PRIMARY: NavItem[] = [
  {label: "Home", href: "/", internal: true},
  {label: "Search", href: "/search", internal: true},
  {label: "Docs", href: "/docs", internal: true},
  {label: "Courses", href: "/courses", internal: true},
  {label: "Discord", href: "/discord", internal: true},
  {label: "Reddit", href: "/reddit", internal: true},
  {label: "GitHub", href: "https://github.com/jonshaffer/wgu-extension", external: true},
];

const DEFAULT_SECONDARY: NavItem[] = [
  {label: "Privacy Policy", href: "/docs/privacy", internal: true},
  {label: "Search Syntax", href: "/docs/search-syntax", internal: true},
  {label: "Style Guide", href: "/docs/style-guide", internal: true},
];

export default function FooterNav({
  className,
  primary = DEFAULT_PRIMARY,
  secondary = DEFAULT_SECONDARY,
  openExternalInNewTab = true,
}: FooterNavProps) {
  return (
    <nav className={cn("container flex flex-col items-center gap-4", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-6">
        {primary.map((item) => {
          const isExternal = !!item.external;
          const isInternal = !!item.internal;
          const externalAttrs = isExternal && openExternalInNewTab ?
            {target: "_blank", rel: "noopener noreferrer"} :
            {};

          if (isInternal) {
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
                  )}
                >
                  {item.label}
                  {isExternal && (
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <a
                href={item.href}
                {...externalAttrs}
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
                )}
              >
                {item.label}
                {isExternal && (
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                )}
              </a>
            </li>
          );
        })}
      </ul>

      {secondary?.length ? (
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {secondary.map((item) => {
            const isInternal = !!item.internal;

            if (isInternal) {
              return (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground transition-opacity hover:opacity-75"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-opacity hover:opacity-75"
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
