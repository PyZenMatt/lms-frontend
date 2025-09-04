import * as React from "react";
import { Label as FigmaLabel } from "./label-figma-adapter";

export type LabelProps = React.ComponentProps<typeof FigmaLabel> & {
  required?: boolean;
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, children, ...props },
  ref
) {
  return (
    <FigmaLabel ref={ref} {...(props as React.ComponentProps<typeof FigmaLabel>)}>
      {children}
      {required ? <span className="ml-1 text-destructive">*</span> : null}
    </FigmaLabel>
  );
});

Label.displayName = "Label";

export default Label;
