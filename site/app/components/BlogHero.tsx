import * as React from "react";
import {Twitter, Linkedin} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

export type Crumb = { href?: string; label: string }

export interface BlogHeroProps {
  /** Top breadcrumb trail */
  crumbs?: Crumb[]
  /** e.g. "10 min read" or 10 */
  readTime?: string | number
  /** Date string or Date object */
  date?: string | Date
  /** Main H1 */
  title: string
  /** Optional subheading */
  subtitle?: string
  /** Optional share URLs */
  share?: { twitter?: string; linkedin?: string }
  /** Background dot pattern image path */
  patternImage?: string
  /** Extra className for outer wrapper */
  className?: string
}

/**
 * BlogHero
 * A responsive hero/header section for blog posts using shadcn/ui.
 * Tailwind-only styling; drop into any shadcn project.
 * @return {JSX.Element} The blog hero component
 */
export default function BlogHero({
  crumbs: _crumbs = [
    {label: "Resources", href: "#"},
    {label: "Blogs", href: "#"},
  ],
  readTime = "10 min read",
  date = "May 18, 2025",
  title = "Building Better Components",
  subtitle = "The best blog is one that captivates readers with engaging, " +
    "well-researched content presented in a clear and relatable way.",
  share,
  patternImage = "/images/patterns/dot-pattern-2.svg",
  className,
}: BlogHeroProps) {
  const dateLabel = React.useMemo(() => formatDateLabel(date), [date]);

  return (
    <section
      className={cn(
        "bg-muted bg-repeat py-20",
        "[background-size:3.125rem_3.125rem]",
        className
      )}
      style={{backgroundImage: `url(${patternImage})`}}
    >
      <div className="flex flex-col items-start justify-start gap-16 py-20 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col items-center justify-center gap-12">
          <div className="flex w-full max-w-[36rem] flex-col items-center justify-center gap-8 mx-auto">
            {/* Meta */}
            <div className="text-muted-foreground flex items-center justify-center gap-2.5 text-sm font-medium">
              <div>{typeof readTime === "number" ? `${readTime} min read` : readTime}</div>
              <div aria-hidden>|</div>
              <div>{dateLabel}</div>
            </div>

            {/* Title */}
            <h1 className="text-center text-[2.5rem] font-semibold leading-[1.2] md:text-5xl lg:text-6xl">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle ? (
              <p className="text-foreground text-center text-xl font-semibold leading-[1.4] max-w-3xl">
                {subtitle}
              </p>
            ) : null}

            {/* Share buttons (optional) */}
            {(share?.twitter || share?.linkedin) && (
              <div className="flex items-center justify-center gap-2.5">
                {share.twitter && (
                  <Button
                    asChild
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Share on Twitter/X"
                  >
                    <a href={share.twitter} target="_blank" rel="noreferrer noopener">
                      <Twitter className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {share.linkedin && (
                  <Button
                    asChild
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Share on LinkedIn"
                  >
                    <a href={share.linkedin} target="_blank" rel="noreferrer noopener">
                      <Linkedin className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDateLabel(date: string | Date): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}
