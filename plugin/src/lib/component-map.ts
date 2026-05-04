/**
 * Thin re-export shim — kept for backward compatibility.
 * frame-scanner.ts imports lookupComponent from here.
 *
 * All component definitions now live in components/*.ts and are aggregated
 * by component-registry.ts.
 */

export { lookupComponent } from "./component-registry";
export type { ComponentEntry, PropDef, SlotDef } from "./render-utils";

// Legacy alias — frame-scanner.ts previously used ComponentDef
export type { ComponentEntry as ComponentDef } from "./render-utils";
