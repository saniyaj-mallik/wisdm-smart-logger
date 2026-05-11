# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-projects.spec.ts >> Projects - Create and Navigate flow >> can create a project and see it in the list
- Location: tests\e2e\05-projects.spec.ts:60:7

# Error details

```
Error: locator.fill: Error: strict mode violation: getByRole('dialog').getByLabel(/name/i) resolved to 2 elements:
    1) <input required="" name="name" id="cp-name" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"/> aka getByRole('textbox', { name: 'Project name *' })
    2) <input id="cp-client" name="clientName" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"/> aka getByRole('textbox', { name: 'Client name' })

Call log:
  - waiting for getByRole('dialog').getByLabel(/name/i)

```

# Page snapshot

```yaml
- generic:
  - generic:
    - complementary:
      - generic:
        - generic:
          - generic:
            - img
          - generic: Smart Logger
        - navigation:
          - generic:
            - paragraph: MAIN
            - generic:
              - link:
                - /url: /dashboard
                - img
                - text: Dashboard
              - link:
                - /url: /logs
                - img
                - text: My Logs
          - generic:
            - paragraph: PROJECTS
            - generic:
              - link:
                - /url: /projects
                - img
                - text: All Projects
          - generic:
            - paragraph: REPORTS
            - generic:
              - link:
                - /url: /reports/summary
                - img
                - text: Summary
              - link:
                - /url: /reports/team
                - img
                - text: Team Overview
              - link:
                - /url: /reports/block-generator
                - img
                - text: Block Generator
              - link:
                - /url: /reports/ai-summary
                - img
                - text: AI Summary
          - generic:
            - paragraph: ADMIN
            - generic:
              - link:
                - /url: /admin/users
                - img
                - text: Users
        - generic:
          - generic:
            - generic:
              - generic: E
            - generic:
              - paragraph: E2E Test User
              - generic: admin
          - generic:
            - generic:
              - link:
                - /url: /profile
                - button:
                  - img
              - button:
                - img
            - button:
              - img
    - main:
      - generic:
        - generic:
          - generic:
            - generic:
              - heading [level=1]: Projects
              - paragraph: All projects and their tasks
          - generic:
            - button:
              - img
              - text: New Project
          - generic:
            - link:
              - /url: /projects/69fd9455c40ba84a762dcc3b
              - generic:
                - generic:
                  - heading [level=3]: dd
                - generic:
                  - generic: Active
                  - generic: 1 task
            - link:
              - /url: /projects/69fc45200697be4dce55ea43
              - generic:
                - generic:
                  - heading [level=3]: ldgr-plugin
                - paragraph: WisdmLabs
                - generic:
                  - generic: 300h
                  - generic: Active
                  - generic: 5 tasks
            - link:
              - /url: /projects/69fc4551c10e106b8374784c
              - generic:
                - generic:
                  - heading [level=3]: smart-logger-internal
                - paragraph: WisdmLabs
                - generic:
                  - generic: 150h
                  - generic: Active
                  - generic: 0 tasks
            - link:
              - /url: /projects/69fc451f0697be4dce55ea38
              - generic:
                - generic:
                  - heading [level=3]: two-lines-press
                - paragraph: Two Lines Press
                - generic:
                  - generic: 200h
                  - generic: Active
                  - generic: 4 tasks
            - link:
              - /url: /projects/69fc451f0697be4dce55ea31
              - generic:
                - generic:
                  - heading [level=3]: upep.mx
                - paragraph: UPEP
                - generic:
                  - generic: 500h
                  - generic: Active
                  - generic: 7 tasks
            - link:
              - /url: /projects/69fc451f0697be4dce55ea3d
              - generic:
                - generic:
                  - heading [level=3]: wisdmlabs-internal
                - generic:
                  - generic: Active
                  - generic: 5 tasks
  - alert
  - dialog "New Project" [ref=e2]:
    - heading "New Project" [level=2] [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e6]:
        - text: Project name *
        - textbox "Project name *" [active] [ref=e7]
      - generic [ref=e8]:
        - text: Client name
        - textbox "Client name" [ref=e9]
      - generic [ref=e10]:
        - text: Budget hours
        - spinbutton "Budget hours" [ref=e11]
      - generic [ref=e12]:
        - text: Description
        - textbox "Description" [ref=e13]
      - generic [ref=e14]:
        - text: Project color
        - generic [ref=e15]:
          - button [ref=e16] [cursor=pointer]
          - button [ref=e17] [cursor=pointer]
          - button [ref=e18] [cursor=pointer]
          - button [ref=e19] [cursor=pointer]
          - button [ref=e20] [cursor=pointer]
          - button [ref=e21] [cursor=pointer]
          - button [ref=e22] [cursor=pointer]
          - button [ref=e23] [cursor=pointer]
          - button [ref=e24] [cursor=pointer]
          - button [ref=e25] [cursor=pointer]
      - button "Create project" [ref=e26] [cursor=pointer]
    - button "Close" [ref=e27] [cursor=pointer]:
      - img [ref=e28]
      - generic [ref=e31]: Close
```

# Test source

```ts
  1  | /**
  2  |  * Projects list page — card grid, create project modal, navigation to detail.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | 
  6  | const UNIQUE_TAG = `E2E-${Date.now()}`;
  7  | 
  8  | test.describe("Projects list page", () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     await page.goto("/projects");
  11 |     await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible({ timeout: 15000 });
  12 |   });
  13 | 
  14 |   test("page heading and description are visible", async ({ page }) => {
  15 |     await expect(page.getByText(/all projects and their tasks/i)).toBeVisible();
  16 |   });
  17 | 
  18 |   test("New Project button is visible", async ({ page }) => {
  19 |     await expect(page.getByRole("button", { name: /new project/i })).toBeVisible();
  20 |   });
  21 | 
  22 |   test("project cards or empty state are shown", async ({ page }) => {
  23 |     const cards = page.locator('[class*="card"], [class*="Card"]');
  24 |     const cardCount = await cards.count();
  25 |     if (cardCount === 0) {
  26 |       await expect(page.getByText(/no projects/i)).toBeVisible();
  27 |     } else {
  28 |       await expect(cards.first()).toBeVisible();
  29 |     }
  30 |   });
  31 | 
  32 |   test("New Project modal opens with correct fields", async ({ page }) => {
  33 |     await page.getByRole("button", { name: /new project/i }).click();
  34 |     const dialog = page.getByRole("dialog");
  35 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  36 |     await expect(dialog.getByLabel(/name/i)).toBeVisible();
  37 |     await expect(dialog.getByLabel(/client/i)).toBeVisible();
  38 |     await expect(dialog.getByLabel(/budget/i)).toBeVisible();
  39 |   });
  40 | 
  41 |   test("New Project modal validates empty name", async ({ page }) => {
  42 |     await page.getByRole("button", { name: /new project/i }).click();
  43 |     const dialog = page.getByRole("dialog");
  44 |     await expect(dialog).toBeVisible();
  45 |     // Submit without filling name
  46 |     await dialog.getByRole("button", { name: /create/i }).click();
  47 |     // Should stay open (validation prevents close)
  48 |     await expect(dialog).toBeVisible();
  49 |   });
  50 | 
  51 |   test("New Project modal closes on Cancel", async ({ page }) => {
  52 |     await page.getByRole("button", { name: /new project/i }).click();
  53 |     await expect(page.getByRole("dialog")).toBeVisible();
  54 |     await page.getByRole("button", { name: /cancel/i }).click();
  55 |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  56 |   });
  57 | });
  58 | 
  59 | test.describe("Projects - Create and Navigate flow", () => {
  60 |   test("can create a project and see it in the list", async ({ page }) => {
  61 |     await page.goto("/projects");
  62 |     const projectName = `Test Project ${UNIQUE_TAG}`;
  63 | 
  64 |     await page.getByRole("button", { name: /new project/i }).click();
  65 |     const dialog = page.getByRole("dialog");
  66 |     await expect(dialog).toBeVisible();
  67 | 
> 68 |     await dialog.getByLabel(/name/i).fill(projectName);
     |                                      ^ Error: locator.fill: Error: strict mode violation: getByRole('dialog').getByLabel(/name/i) resolved to 2 elements:
  69 |     await dialog.getByRole("button", { name: /create/i }).click();
  70 | 
  71 |     // Modal closes and project appears in list
  72 |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  73 |     await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });
  74 |   });
  75 | 
  76 |   test("clicking a project card navigates to project detail", async ({ page }) => {
  77 |     await page.goto("/projects");
  78 |     const firstCard = page.locator('a[href*="/projects/"]').first();
  79 |     const count = await firstCard.count();
  80 |     if (count === 0) {
  81 |       test.skip();
  82 |       return;
  83 |     }
  84 |     await firstCard.click();
  85 |     await expect(page).toHaveURL(/\/projects\/[a-f0-9]+/, { timeout: 15000 });
  86 |   });
  87 | });
  88 | 
```