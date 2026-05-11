/**
 * Re-exports the base test with a storageState fixture already applied.
 * Import `test` from this file in any spec that needs an authenticated session.
 */
import { test as base, expect } from "@playwright/test";

export const test = base.extend({});
export { expect };
