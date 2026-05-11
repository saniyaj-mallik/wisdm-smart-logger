# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-project-detail.spec.ts >> Project Detail page >> Add Task modal closes on Cancel
- Location: tests\e2e\06-project-detail.spec.ts:71:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /cancel/i })

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
          - link:
            - /url: /projects
            - img
            - text: All Projects
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: D
                  - generic:
                    - generic:
                      - heading [level=1]: dd
                      - generic: Active
                - button:
                  - img
                  - text: Edit
            - generic:
              - generic:
                - generic:
                  - img
                - generic:
                  - paragraph: Active Tasks
                  - paragraph: "1"
              - generic:
                - generic:
                  - img
                - generic:
                  - paragraph: Est. Hours
                  - paragraph: —
              - generic:
                - generic:
                  - img
                - generic:
                  - paragraph: Assignees
                  - paragraph: —
          - generic:
            - generic:
              - generic:
                - heading [level=2]: Tasks
                - generic: "1"
              - button:
                - img
                - text: Add Task
            - generic:
              - generic:
                - generic: Task
                - generic: Estimated
                - generic: Logged
                - generic: Assigned
              - generic:
                - generic:
                  - img
                - generic:
                  - generic:
                    - paragraph: d task
                - generic:
                  - paragraph: —
                - generic:
                  - paragraph: 0.5h
                - generic:
                  - generic: Unassigned
                - generic:
                  - button:
                    - img
  - alert
  - dialog "Add Task" [ref=e2]:
    - heading "Add Task" [level=2] [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e6]:
        - text: Task name *
        - textbox "Task name *" [active] [ref=e7]
      - generic [ref=e8]:
        - text: Estimated hours
        - spinbutton "Estimated hours" [ref=e9]
      - generic [ref=e10]:
        - text: Description
        - textbox "Description" [ref=e11]
      - generic [ref=e12]:
        - text: Assign to
        - generic [ref=e13]:
          - button "E E2E Test User(you)" [ref=e14] [cursor=pointer]:
            - generic [ref=e16]: E
            - paragraph [ref=e18]: E2E Test User(you)
          - button "A Admin User" [ref=e20] [cursor=pointer]:
            - generic [ref=e22]: A
            - paragraph [ref=e24]: Admin User
          - button "S Saniyaj Mallik" [ref=e26] [cursor=pointer]:
            - generic [ref=e28]: S
            - paragraph [ref=e30]: Saniyaj Mallik
      - button "Add task" [ref=e32] [cursor=pointer]
    - button "Close" [ref=e33] [cursor=pointer]:
      - img [ref=e34]
      - generic [ref=e37]: Close
```

# Test source

```ts
  1   | /**
  2   |  * Project Detail page — hero header, stats strip, task table, task logs panel,
  3   |  * Log Time from panel, Add Task modal.
  4   |  */
  5   | import { test, expect } from "@playwright/test";
  6   | 
  7   | async function getFirstProjectUrl(page: any): Promise<string | null> {
  8   |   await page.goto("/projects");
  9   |   const link = page.locator('a[href*="/projects/"]').first();
  10  |   const count = await link.count();
  11  |   if (!count) return null;
  12  |   return link.getAttribute("href");
  13  | }
  14  | 
  15  | test.describe("Project Detail page", () => {
  16  |   let projectUrl: string;
  17  | 
  18  |   test.beforeAll(async ({ browser }) => {
  19  |     const page = await browser.newPage();
  20  |     const url = await getFirstProjectUrl(page);
  21  |     await page.close();
  22  |     projectUrl = url ?? "/projects";
  23  |   });
  24  | 
  25  |   test.beforeEach(async ({ page }) => {
  26  |     if (projectUrl === "/projects") {
  27  |       test.skip();
  28  |       return;
  29  |     }
  30  |     await page.goto(projectUrl);
  31  |     await page.waitForLoadState("networkidle");
  32  |   });
  33  | 
  34  |   test("back link to All Projects is visible", async ({ page }) => {
  35  |     await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
  36  |   });
  37  | 
  38  |   test("project hero header card is visible", async ({ page }) => {
  39  |     // Hero has the project name as a heading
  40  |     const heading = page.getByRole("heading").first();
  41  |     await expect(heading).toBeVisible();
  42  |   });
  43  | 
  44  |   test("Edit button is visible on project header", async ({ page }) => {
  45  |     await expect(page.getByRole("button", { name: /edit/i }).first()).toBeVisible();
  46  |   });
  47  | 
  48  |   test("stats strip shows Active Tasks / Est. Hours / Assignees", async ({ page }) => {
  49  |     await expect(page.getByText(/active tasks/i)).toBeVisible();
  50  |     await expect(page.getByText(/est\. hours/i)).toBeVisible();
  51  |     await expect(page.getByText(/assignees/i)).toBeVisible();
  52  |   });
  53  | 
  54  |   test("task list column headers are visible", async ({ page }) => {
  55  |     await expect(page.getByText(/estimated/i)).toBeVisible();
  56  |     await expect(page.getByText(/logged/i)).toBeVisible();
  57  |     await expect(page.getByText(/assigned/i)).toBeVisible();
  58  |   });
  59  | 
  60  |   test("Add Task button is visible", async ({ page }) => {
  61  |     await expect(page.getByRole("button", { name: /add task/i })).toBeVisible();
  62  |   });
  63  | 
  64  |   test("Add Task modal opens with required fields", async ({ page }) => {
  65  |     await page.getByRole("button", { name: /add task/i }).click();
  66  |     const dialog = page.getByRole("dialog");
  67  |     await expect(dialog).toBeVisible({ timeout: 5000 });
  68  |     await expect(dialog.getByLabel(/task name/i).or(dialog.getByLabel(/name/i)).first()).toBeVisible();
  69  |   });
  70  | 
  71  |   test("Add Task modal closes on Cancel", async ({ page }) => {
  72  |     await page.getByRole("button", { name: /add task/i }).click();
  73  |     await expect(page.getByRole("dialog")).toBeVisible();
> 74  |     await page.getByRole("button", { name: /cancel/i }).click();
      |                                                         ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  75  |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  76  |   });
  77  | 
  78  |   test("clicking a task row opens the logs panel", async ({ page }) => {
  79  |     const taskRows = page.locator('[class*="cursor-pointer"]').filter({
  80  |       has: page.locator("text=/h|—/"),
  81  |     });
  82  |     const rowCount = await taskRows.count();
  83  |     if (rowCount === 0) {
  84  |       // Try any clickable row
  85  |       const tableRow = page.locator("tr").nth(1);
  86  |       const trCount = await tableRow.count();
  87  |       if (!trCount) return;
  88  |       await tableRow.click();
  89  |     } else {
  90  |       await taskRows.first().click();
  91  |     }
  92  |     // Sheet/panel should open
  93  |     await expect(page.getByRole("dialog").or(page.locator('[data-state="open"]')).first()).toBeVisible({ timeout: 8000 });
  94  |   });
  95  | 
  96  |   test("task logs panel has Log Time button", async ({ page }) => {
  97  |     // Open first task
  98  |     const taskRow = page.locator("tr").nth(1);
  99  |     const rowCount = await taskRow.count();
  100 |     if (!rowCount) return;
  101 |     await taskRow.click();
  102 | 
  103 |     const panel = page.locator('[role="dialog"]');
  104 |     await expect(panel).toBeVisible({ timeout: 8000 });
  105 |     await expect(panel.getByRole("button", { name: /log time/i })).toBeVisible();
  106 |   });
  107 | 
  108 |   test("Log Time button in panel opens LogTimeModal with pre-filled task", async ({ page }) => {
  109 |     const taskRow = page.locator("tr").nth(1);
  110 |     const rowCount = await taskRow.count();
  111 |     if (!rowCount) return;
  112 |     await taskRow.click();
  113 | 
  114 |     const panel = page.locator('[role="dialog"]').first();
  115 |     await expect(panel).toBeVisible({ timeout: 8000 });
  116 | 
  117 |     // Click Log Time — this should open a second dialog (LogTimeModal)
  118 |     await panel.getByRole("button", { name: /log time/i }).click();
  119 | 
  120 |     // Two dialogs: the panel (sheet) + the log time modal
  121 |     const dialogs = page.locator('[role="dialog"]');
  122 |     await expect(dialogs).toHaveCount(2, { timeout: 5000 });
  123 |   });
  124 | 
  125 |   test("Edit project modal opens with existing values", async ({ page }) => {
  126 |     await page.getByRole("button", { name: /edit/i }).first().click();
  127 |     const dialog = page.getByRole("dialog");
  128 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  129 |     // Name field should be pre-filled
  130 |     const nameInput = dialog.getByLabel(/name/i).first();
  131 |     const value = await nameInput.inputValue();
  132 |     expect(value.length).toBeGreaterThan(0);
  133 |   });
  134 | });
  135 | 
```