import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import * as matchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe/matchers";
expect.extend(matchers);

/* vitest-axe 0.1 ships its augmentation against the legacy global `Vi`
   namespace, which Vitest 2 no longer merges into the assertion chain. Declaring
   it against the "vitest" module is what makes `toHaveNoViolations()`
   type-check in every a11y test. */
declare module "vitest" {
  interface Assertion extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
