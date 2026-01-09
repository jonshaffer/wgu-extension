import React, {useState} from "react";

interface WguExpansionPanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  id?: string;
}

export function WguExpansionPanel({
  title,
  children,
  defaultExpanded = false,
  id = `wgu-panel-${Math.random().toString(36).substr(2, 9)}`,
}: WguExpansionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const headerId = `${id}-header`;
  const contentId = `${id}-content`;

  return (
    <div
      className={`mat-expansion-panel mat-elevation-z0 mat-expansion-panel-animations-enabled ${
        isExpanded ? "mat-expanded mat-expansion-panel-spacing" : ""
      }`}
      style={{
        display: "block",
        marginBottom: isExpanded ? "16px" : "0",
        borderRadius: isExpanded ? "4px" : "0",
      }}
    >
      {/* Header */}
      <div
        className={`mat-expansion-panel-header mat-focus-indicator mat-expansion-toggle-indicator-after ${
          isExpanded ? "mat-expanded" : ""
        }`}
        role="button"
        id={headerId}
        tabIndex={0}
        aria-controls={contentId}
        aria-expanded={isExpanded}
        aria-disabled="false"
        onClick={togglePanel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            togglePanel();
          }
        }}
        style={{
          height: "40px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderRadius: isExpanded ? "4px 4px 0 0" : "4px",
        }}
      >
        <span className="mat-content" style={{flex: 1}}>
          <div className="mat-expansion-panel-header-title">
            <span className="accordion-title" style={{fontSize: "14px", fontWeight: 500}}>
              {title}
            </span>
          </div>
        </span>

        <span
          className="mat-expansion-indicator"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 225ms cubic-bezier(0.4, 0.0, 0.2, 1)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
            style={{width: "24px", height: "24px", fill: "currentColor"}}
          >
            <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"></path>
          </svg>
        </span>
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          className="mat-expansion-panel-content-wrapper"
          style={{
            overflow: "hidden",
            visibility: "visible",
          }}
        >
          <div
            role="region"
            className="mat-expansion-panel-content"
            id={contentId}
            aria-labelledby={headerId}
          >
            <div className="mat-expansion-panel-body">
              <div className="expansion-content" style={{padding: "0 24px 16px 24px"}}>
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WguExpansionPanel;
