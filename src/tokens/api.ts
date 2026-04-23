// Fetches variable collections and variables from the Figma REST API.
// Endpoint: GET /v1/files/:fileKey/variables/local
// Auth: FIGMA_PAT env var (ADR-008)

import type { FigmaVariable, FigmaVariableCollection } from "./types.js";

const BASE = "https://api.figma.com/v1";

export interface FigmaVariablesResponse {
  collections: Record<string, FigmaVariableCollection>;
  variables: Record<string, FigmaVariable>;
}

export async function fetchVariables(
  fileKey: string,
  pat: string
): Promise<FigmaVariablesResponse> {
  const res = await fetch(`${BASE}/files/${fileKey}/variables/local`, {
    headers: { "X-Figma-Token": pat },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API ${res.status}: ${text}`);
  }

  const body = await res.json();
  return {
    collections: body.meta.variableCollections,
    variables: body.meta.variables,
  };
}
