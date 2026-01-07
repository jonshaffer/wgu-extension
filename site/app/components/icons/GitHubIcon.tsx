import React from "react";
import {siGithub} from "simple-icons";
import {cn} from "~/lib/utils";

interface GitHubIconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "w-3 h-3", // 12px
  sm: "w-4 h-4", // 16px
  md: "w-5 h-5", // 20px
  lg: "w-6 h-6", // 24px
  xl: "w-8 h-8", // 32px
};

export function GitHubIcon({className = "", size = "sm"}: GitHubIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], "fill-current", className)}
    >
      <title>GitHub</title>
      <path d={siGithub.path} />
    </svg>
  );
}
