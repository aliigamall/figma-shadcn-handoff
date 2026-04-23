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
