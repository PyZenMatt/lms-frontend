export * from "@/components/figma/ui/skeleton";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: boolean;
}

export function Skeleton({ className, rounded = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        rounded ? "rounded-md" : "",
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
