export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variableIds: string[];
}

export interface FigmaVariable {
  id: string;
  name: string;
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
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ResolvedToken {
  cssVar: string;
  light: string;
  dark?: string;
  collection: string;
}

// ── Component map (components.json) ──────────────────────────────────────

export interface ComponentMapping {
  /** Import path, e.g. "@/components/ui/button" */
  import: string;
  /** Figma property name → React prop name */
  props?: Record<string, string>;
  /** Props whose value matches this default are omitted from the JSX */
  defaults?: Record<string, string>;
  /** Figma property name → { FigmaValue: "booleanPropName" } */
  booleans?: Record<string, Record<string, string>>;
  /** Figma TEXT property whose value becomes children */
  children?: string;
}

export type ComponentMap = Record<string, ComponentMapping>;
