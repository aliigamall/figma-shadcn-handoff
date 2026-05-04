/**
 * Component Registry
 *
 * Aggregates all component group definitions and renderers into flat maps.
 * Provides lookupComponent and RENDERER_MAP for use by component-map.ts and jsx-generator.ts.
 */

import type { ComponentEntry, RenderFn } from "./render-utils";
import { group as buttonsGroup }    from "./components/buttons";
import { group as inputsGroup }     from "./components/inputs";
import { group as navigationGroup } from "./components/navigation";
import { group as overlaysGroup }   from "./components/overlays";
import { group as dataGroup }       from "./components/data";
import { group as formsGroup }      from "./components/forms";
import { group as displayGroup }    from "./components/display";
import { group as dateGroup }       from "./components/date";
import { group as miscGroup }       from "./components/misc";

const ALL_GROUPS = [
  buttonsGroup,
  inputsGroup,
  navigationGroup,
  overlaysGroup,
  dataGroup,
  formsGroup,
  displayGroup,
  dateGroup,
  miscGroup,
];

const COMPONENT_MAP: Record<string, ComponentEntry> = {};
export const RENDERER_MAP: Record<string, RenderFn> = {};

for (const g of ALL_GROUPS) {
  Object.assign(COMPONENT_MAP, g.defs);
  if (g.renderers) Object.assign(RENDERER_MAP, g.renderers);
}

/**
 * Look up an Obra Figma component name in the map.
 * Strips variant suffix (e.g. "Button / Primary" → "Button") before lookup.
 */
export function lookupComponent(figmaName: string): ComponentEntry | undefined {
  if (COMPONENT_MAP[figmaName]) return COMPONENT_MAP[figmaName];
  const base = figmaName.split(/[/,]/)[0].trim();
  return COMPONENT_MAP[base] ?? undefined;
}
