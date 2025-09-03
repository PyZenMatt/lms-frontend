// This file is a thin proxy to the real TSX implementation to avoid
// esbuild attempting to parse JSX inside a .ts file (which causes
// "Expected '>' but found 'size'" errors). Keep this file free of JSX.

export { getMenuByRole } from "./getMenuByRole.tsx";
export type { Role, MenuItem, MenuSection } from "./getMenuByRole.tsx";
