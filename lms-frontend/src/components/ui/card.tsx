import {
  Card as FigmaCard,
  CardHeader as FigmaCardHeader,
  CardContent as FigmaCardContent,
  CardFooter as FigmaCardFooter,
  CardTitle as FigmaCardTitle,
  CardDescription as FigmaCardDescription,
} from "./card-figma-adapter";

import * as React from "react";
import { cn } from "./utils";

export const CardHeader = FigmaCardHeader;
export const CardContent = FigmaCardContent;
export const CardFooter = FigmaCardFooter;
export const CardTitle = FigmaCardTitle;
export const CardDescription = FigmaCardDescription;

export const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FigmaCard>>(function Card({ className, ...props }, ref) {
  return (
    <FigmaCard ref={ref} className={cn("bg-card text-card-foreground rounded-lg border border-border shadow-card", className)} {...props} />
  );
});

Card.displayName = "Card";

export default Card;
