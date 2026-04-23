// ---- Figma REST API shapes (subset of /v1/files/:key/variables) ----

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variableIds: string[];
}

export interface FigmaVariable {
  id: string;
  name: string; // slash-separated path, e.g. "general/background"
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, FigmaVariableValue>;
  variableCollectionId: string;
}

export type FigmaVariableValue =
  | { type: "VARIABLE_ALIAS"; id: string }
  | RgbaValue
  | number
  | string
  | boolean;

export interface RgbaValue {
  r: number; // 0–1
  g: number;
  b: number;
  a: number;
}

// ---- Internal resolved shapes ----

export interface ResolvedToken {
  /** Final CSS variable name, e.g. "--background" or "--color-red-500" */
  cssVar: string;
  /** Light mode value (raw hex or resolved var reference) */
  light: string;
  /** Dark mode value — undefined if collection has no second mode */
  dark?: string;
  /** Source collection name */
  collection: string;
}
