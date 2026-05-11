# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-project-detail.spec.ts >> Project Detail page >> back link to All Projects is visible
- Location: tests\e2e\06-project-detail.spec.ts:34:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /all projects/i })
Expected: visible
Error: strict mode violation: getByRole('link', { name: /all projects/i }) resolved to 2 elements:
    1) <a href="/projects" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[1px] pl-[calc(0.75rem+1px)]">…</a> aka getByRole('navigation').getByRole('link', { name: 'All Projects' })
    2) <a href="/projects" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">…</a> aka getByRole('main').getByRole('link', { name: 'All Projects' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /all projects/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - img [ref=e7]
          - generic [ref=e10]: Smart Logger
        - navigation [ref=e11]:
          - generic [ref=e12]:
            - paragraph [ref=e13]: MAIN
            - generic [ref=e14]:
              - link "Dashboard" [ref=e15] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e16]
                - text: Dashboard
              - link "My Logs" [ref=e21] [cursor=pointer]:
                - /url: /logs
                - img [ref=e22]
                - text: My Logs
          - generic [ref=e25]:
            - paragraph [ref=e26]: PROJECTS
            - link "All Projects" [ref=e28] [cursor=pointer]:
              - /url: /projects
              - img [ref=e29]
              - text: All Projects
          - generic [ref=e31]:
            - paragraph [ref=e32]: REPORTS
            - generic [ref=e33]:
              - link "Summary" [ref=e34] [cursor=pointer]:
                - /url: /reports/summary
                - img [ref=e35]
                - text: Summary
              - link "Team Overview" [ref=e37] [cursor=pointer]:
                - /url: /reports/team
                - img [ref=e38]
                - text: Team Overview
              - link "Block Generator" [ref=e43] [cursor=pointer]:
                - /url: /reports/block-generator
                - img [ref=e44]
                - text: Block Generator
              - link "AI Summary" [ref=e47] [cursor=pointer]:
                - /url: /reports/ai-summary
                - img [ref=e48]
                - text: AI Summary
          - generic [ref=e51]:
            - paragraph [ref=e52]: ADMIN
            - link "Users" [ref=e54] [cursor=pointer]:
              - /url: /admin/users
              - img [ref=e55]
              - text: Users
        - generic [ref=e67]:
          - generic [ref=e68]:
            - generic [ref=e70]: E
            - generic [ref=e71]:
              - paragraph [ref=e72]: E2E Test User
              - generic [ref=e73]: admin
          - generic [ref=e74]:
            - generic [ref=e75]:
              - link [ref=e76] [cursor=pointer]:
                - /url: /profile
                - button [ref=e77]:
                  - img
              - button [ref=e78] [cursor=pointer]:
                - img
            - button "Toggle theme" [ref=e79] [cursor=pointer]:
              - img
    - main [ref=e80]:
      - generic [ref=e82]:
        - link "All Projects" [ref=e83] [cursor=pointer]:
          - /url: /projects
          - img [ref=e84]
          - text: All Projects
        - generic [ref=e86]:
          - generic [ref=e89]:
            - generic [ref=e90]:
              - generic [ref=e91]: D
              - generic [ref=e93]:
                - heading "dd" [level=1] [ref=e94]
                - generic [ref=e95]: Active
            - button "Edit" [ref=e96] [cursor=pointer]:
              - img
              - text: Edit
          - generic [ref=e97]:
            - generic [ref=e98]:
              - img [ref=e100]
              - generic [ref=e103]:
                - paragraph [ref=e104]: Active Tasks
                - paragraph [ref=e105]: "1"
            - generic [ref=e106]:
              - img [ref=e108]
              - generic [ref=e111]:
                - paragraph [ref=e112]: Est. Hours
                - paragraph [ref=e113]: —
            - generic [ref=e114]:
              - img [ref=e116]
              - generic [ref=e121]:
                - paragraph [ref=e122]: Assignees
                - paragraph [ref=e123]: —
        - generic [ref=e124]:
          - generic [ref=e125]:
            - generic [ref=e126]:
              - heading "Tasks" [level=2] [ref=e127]
              - generic [ref=e128]: "1"
            - button "Add Task" [ref=e129] [cursor=pointer]:
              - img
              - text: Add Task
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]: Task
              - generic [ref=e133]: Estimated
              - generic [ref=e134]: Logged
              - generic [ref=e135]: Assigned
            - generic [ref=e136] [cursor=pointer]:
              - img [ref=e138]
              - paragraph [ref=e143]: d task
              - paragraph [ref=e145]: —
              - paragraph [ref=e147]: 0.5h
              - generic [ref=e149]: Unassigned
              - button [ref=e151]:
                - img
  - alert [ref=e152]
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
> 35  |     await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
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
  74  |     await page.getByRole("button", { name: /cancel/i }).click();
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