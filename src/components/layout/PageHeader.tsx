import React from "react"

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, right, className = "" }: Props) {
  return (
    <div className={"flex items-end justify-between gap-4 py-6 " + className}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
