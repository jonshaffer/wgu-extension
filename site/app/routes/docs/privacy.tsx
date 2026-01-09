import React, {useMemo, useEffect, useState} from "react";
import {Link} from "react-router";
import {Marked} from "marked";
import {Navigation} from "../../components/Navigation";
import {Footer} from "../../components/Footer";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {Mail, Twitter, Linkedin} from "lucide-react";
import privacyContent from "../../content/PRIVACY.md?raw";

export function meta() {
  return [
    {title: "Privacy Policy - Unofficial WGU Extension"},
    {
      name: "description",
      content: "Privacy policy for the Unofficial WGU Extension - " +
        "we don't collect, store, or process any personal data",
    },
  ];
}

interface Section {
  id: string;
  title: string;
  level: number;
}

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);

  // Calculate read time based on word count (200 words per minute)
  const wordCount = privacyContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  // Parse markdown content, removing the main title since BlogHero provides it
  const parsedContent = useMemo(() => {
    const contentWithoutTitle = privacyContent.replace(/^# Privacy Policy\n+/, "");

    // Extract sections for table of contents
    const sectionMatches = contentWithoutTitle.matchAll(/^(#{2,3})\s+(.+)$/gm);
    const extractedSections: Section[] = [];

    for (const match of sectionMatches) {
      const level = match[1].length;
      const title = match[2];
      const id = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      extractedSections.push({id, title, level});
    }

    setSections(extractedSections);

    // Create a new marked instance with custom renderer
    const markedWithHeadingIds = new Marked({
      renderer: {
        heading(token) {
          const text = this.parser.parseInline(token.tokens);
          const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          return `<h${token.depth} id="${id}" class="scroll-mt-24">${text}</h${token.depth}>`;
        },
      },
    });

    return markedWithHeadingIds.parse(contentWithoutTitle);
  }, [privacyContent]);

  // Handle scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const {offsetTop, offsetHeight} = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: "smooth", block: "start"});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pb-32">
        {/* Hero Section */}
        <div
          className={[
            "bg-muted bg-[url('/images/patterns/dot-pattern-2.svg')]",
            "bg-[length:3.125rem_3.125rem] bg-repeat py-20",
          ].join(" ")}
        >
          <div
            className={[
              "flex flex-col items-start justify-start gap-16 py-20",
              "lg:flex-row lg:items-end lg:justify-between",
            ].join(" ")}
          >
            <div className="flex w-full flex-col items-center justify-center gap-12">
              <div className="flex w-full max-w-[36rem] flex-col items-center justify-center gap-8">
                {/* Breadcrumb */}
                <nav aria-label="breadcrumb">
                  <ol
                    className={[
                      "text-muted-foreground flex flex-wrap items-center gap-1.5",
                      "text-sm break-words sm:gap-2.5",
                    ].join(" ")}
                  >
                    <li className="inline-flex items-center gap-1.5">
                      <Link to="/docs" className="hover:text-foreground transition-colors">
                        Docs
                      </Link>
                    </li>
                    <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
                      /
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <span className="text-foreground">Privacy Policy</span>
                    </li>
                  </ol>
                </nav>

                <div className="flex w-full flex-col gap-5">
                  {/* Meta */}
                  <div className="text-muted-foreground flex items-center justify-center gap-2.5 text-sm font-medium">
                    <div>{readTime} min read</div>
                    <div>|</div>
                    <div>April 12, 2025</div>
                  </div>

                  {/* Title */}
                  <h1 className="text-center text-[2.5rem] font-semibold leading-[1.2] md:text-5xl lg:text-6xl">
                    Privacy Policy
                  </h1>

                  {/* Subtitle */}
                  <p className="text-foreground text-center text-xl font-semibold leading-[1.4]">
                    Unofficial WGU Extension is committed to protecting your privacy.
                    Learn how we handle your information.
                  </p>

                  {/* Share buttons */}
                  <div className="flex items-center justify-center gap-2.5">
                    <Button size="icon" className="size-9" asChild>
                      <a
                        href={
                          "https://twitter.com/intent/tweet?" +
                          `text=${encodeURIComponent("Unofficial WGU Extension Privacy Policy")}` +
                          `&url=${encodeURIComponent("https://wgu-extension.com/docs/privacy")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                    <Button size="icon" className="size-9" asChild>
                      <a
                        href={
                          "https://www.linkedin.com/sharing/share-offsite/?" +
                          `url=${encodeURIComponent("https://wgu-extension.com/docs/privacy")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container pt-20">
          <div className="relative mx-auto w-full max-w-5xl items-start justify-between gap-20 lg:flex">
            {/* Left Sidebar - Chapters */}
            <div className="bg-background top-20 flex-1 pb-10 lg:sticky lg:pb-0">
              <div className="text-xl font-medium leading-snug">Chapters</div>
              <div className="flex flex-col gap-2 pl-2 pt-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "block text-sm font-medium leading-normal transition duration-300",
                      activeSection === section.id ?
                        "lg:bg-muted lg:!text-primary lg:rounded-md lg:p-2 lg:font-bold" :
                        "text-muted-foreground",
                      section.level === 3 && "pl-4"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex w-full max-w-[40rem] flex-col gap-10">
              {/* Author Info */}
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "relative flex shrink-0 overflow-hidden rounded-full",
                    "size-12 border bg-muted",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-full w-full items-center justify-center",
                      "rounded-full bg-muted text-sm font-medium",
                    ].join(" ")}
                  >
                    WGU
                  </span>
                </span>
                <div>
                  <div className="text-sm font-normal leading-normal">
                    Unofficial WGU Extension Team
                  </div>
                  <div className="text-muted-foreground text-sm font-normal leading-normal">
                    Privacy &amp; Compliance
                  </div>
                </div>
              </div>

              {/* Main Privacy Content */}
              <div className="prose dark:prose-invert">
                {/* Key Takeaways */}
                <h2>Key Takeaways</h2>
                <p>• We do not collect, store, or process any personal data from users</p>
                <p>• All extension data remains locally on your device</p>
                <p>• No third-party analytics or tracking services are used</p>
                <p>• Your privacy is our top priority - we believe in complete transparency</p>

                {/* Rendered Markdown Content */}
                <div dangerouslySetInnerHTML={{__html: parsedContent}} />
              </div>

              {/* Contact Card */}
              <div className="bg-muted flex flex-col gap-4 rounded-lg p-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      "relative flex shrink-0 overflow-hidden rounded-full",
                      "size-12 border bg-background",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-full w-full items-center justify-center",
                        "rounded-full text-sm font-medium",
                      ].join(" ")}
                    >
                      <Mail className="h-5 w-5" />
                    </span>
                  </span>
                  <div>
                    <div className="text-sm font-normal leading-normal">
                      Privacy Team
                    </div>
                    <div className="text-muted-foreground text-sm font-normal leading-normal">
                      Unofficial WGU Extension
                    </div>
                  </div>
                </div>
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices,
                  please don&apos;t hesitate to contact us. We&apos;re committed to
                  transparency and are happy to address any concerns you may have.
                </p>
                <div className="flex items-center gap-2.5">
                  <Button size="sm" asChild>
                    <a href="mailto:privacy@hyperfluidsolutions.com">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Privacy Team
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
