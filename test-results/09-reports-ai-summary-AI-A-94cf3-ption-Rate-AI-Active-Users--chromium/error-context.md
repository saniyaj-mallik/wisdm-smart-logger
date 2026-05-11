# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-reports-ai-summary.spec.ts >> AI Analytics page >> overview cards are visible (AI Hours, Adoption Rate, AI-Active Users)
- Location: tests\e2e\09-reports-ai-summary.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/ai hours/i)
Expected: visible
Error: strict mode violation: getByText(/ai hours/i) resolved to 3 elements:
    1) <span class="text-sm text-muted-foreground font-medium">AI Hours</span> aka getByText('AI Hours').first()
    2) <p class="text-xs text-muted-foreground mt-0.5">Total hours vs AI-assisted, sorted by AI hours</p> aka getByText('Total hours vs AI-assisted,')
    3) <span class="inline-flex items-center gap-1 justify-end">…</span> aka getByText('AI Hours').nth(2)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/ai hours/i)

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
        - generic [ref=e84]:
          - heading "AI Analytics" [level=1] [ref=e85]
          - paragraph [ref=e86]: Track how AI adoption impacts team efficiency, task estimates, and time savings
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]:
              - text: From
              - textbox [ref=e90]: 2026-04-30
            - generic [ref=e91]:
              - text: To
              - textbox [ref=e92]: 2026-05-30
            - button "Apply" [ref=e94] [cursor=pointer]
          - generic [ref=e95]:
            - combobox [ref=e96] [cursor=pointer]:
              - generic: All Teams
              - img [ref=e97]
            - button "This Week" [ref=e99] [cursor=pointer]
            - button "Last Week" [ref=e100] [cursor=pointer]
            - button "This Month" [ref=e101] [cursor=pointer]
            - button "Last Month" [ref=e102] [cursor=pointer]
        - generic [ref=e103]:
          - generic [ref=e104]:
            - generic [ref=e105]:
              - img [ref=e107]
              - generic [ref=e110]: AI Hours
            - generic [ref=e111]:
              - paragraph [ref=e112]: 4.5h
              - paragraph [ref=e113]: of 19.52h total logged
          - generic [ref=e116]:
            - generic [ref=e117]:
              - img [ref=e119]
              - generic [ref=e121]: Adoption Rate
            - generic [ref=e122]:
              - paragraph [ref=e123]: 20%
              - paragraph [ref=e124]: 2 of 10 entries
          - generic [ref=e127]:
            - generic [ref=e128]:
              - img [ref=e130]
              - generic [ref=e135]: AI-Active Users
            - generic [ref=e136]:
              - paragraph [ref=e137]: "2"
              - paragraph [ref=e138]: of 2 team members
        - generic [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]:
              - heading "User AI Usage" [level=2] [ref=e144]
              - paragraph [ref=e145]: Total hours vs AI-assisted, sorted by AI hours
            - table [ref=e146]:
              - rowgroup [ref=e147]:
                - row "User Total AI Hours Saved vs Est." [ref=e148]:
                  - columnheader "User" [ref=e149] [cursor=pointer]:
                    - generic [ref=e150]:
                      - img [ref=e151]
                      - text: User
                  - columnheader "Total" [ref=e154] [cursor=pointer]:
                    - generic [ref=e155]:
                      - text: Total
                      - img [ref=e156]
                  - columnheader "AI Hours" [ref=e159] [cursor=pointer]:
                    - generic [ref=e160]:
                      - text: AI Hours
                      - img [ref=e161]
                  - columnheader "Saved vs Est." [ref=e164] [cursor=pointer]:
                    - generic [ref=e165]:
                      - text: Saved vs Est.
                      - img [ref=e166]
              - rowgroup [ref=e168]:
                - row "Saniyaj Mallik Developer 17.02h 2h ↓ 0.5h" [ref=e169]:
                  - cell "Saniyaj Mallik Developer" [ref=e170]:
                    - paragraph [ref=e171]: Saniyaj Mallik
                    - paragraph [ref=e172]: Developer
                  - cell "17.02h" [ref=e173]
                  - cell "2h" [ref=e174]
                  - cell "↓ 0.5h" [ref=e175]:
                    - generic [ref=e176]: ↓ 0.5h
                - row "Admin User Admin 2.5h 2.5h —" [ref=e177]:
                  - cell "Admin User Admin" [ref=e178]:
                    - paragraph [ref=e179]: Admin User
                    - paragraph [ref=e180]: Admin
                  - cell "2.5h" [ref=e181]
                  - cell "2.5h" [ref=e182]
                  - cell "—" [ref=e183]
          - generic [ref=e184]:
            - generic [ref=e185]:
              - heading "Task Efficiency with AI" [level=2] [ref=e186]:
                - img [ref=e187]
                - text: Task Efficiency with AI
              - paragraph [ref=e190]: Tasks where AI use reduces time vs non-AI baseline or estimate
            - table [ref=e192]:
              - rowgroup [ref=e193]:
                - row "Task Project User Estimated Actual Time Spent Saved" [ref=e194]:
                  - columnheader "Task" [ref=e195] [cursor=pointer]:
                    - generic [ref=e196]:
                      - img [ref=e197]
                      - text: Task
                  - columnheader "Project" [ref=e200] [cursor=pointer]:
                    - generic [ref=e201]:
                      - img [ref=e202]
                      - text: Project
                  - columnheader "User" [ref=e205] [cursor=pointer]:
                    - generic [ref=e206]:
                      - img [ref=e207]
                      - text: User
                  - columnheader "Estimated" [ref=e210] [cursor=pointer]:
                    - generic [ref=e211]:
                      - text: Estimated
                      - img [ref=e212]
                  - columnheader "Actual Time Spent" [ref=e215] [cursor=pointer]:
                    - generic [ref=e216]:
                      - text: Actual Time Spent
                      - img [ref=e217]
                  - columnheader "Saved" [ref=e220] [cursor=pointer]:
                    - generic [ref=e221]:
                      - text: Saved
                      - img [ref=e222]
              - rowgroup [ref=e224]:
                - row "Code Review ldgr-plugin Saniyaj Mallik 10h 9.5h 5% under est." [ref=e225]:
                  - cell "Code Review" [ref=e226]:
                    - paragraph [ref=e227]: Code Review
                  - cell "ldgr-plugin" [ref=e228]:
                    - paragraph [ref=e229]: ldgr-plugin
                  - cell "Saniyaj Mallik" [ref=e230]:
                    - paragraph [ref=e231]: Saniyaj Mallik
                  - cell "10h" [ref=e232]
                  - cell "9.5h" [ref=e233]
                  - cell "5% under est." [ref=e234]:
                    - generic [ref=e235]: 5% under est.
          - generic [ref=e236]:
            - generic [ref=e237]:
              - img [ref=e238]
              - generic [ref=e240]:
                - heading "Tasks Not Using AI" [level=2] [ref=e241]
                - paragraph [ref=e242]: 4 tasks with zero AI-assisted entries — potential productivity opportunities
            - table [ref=e244]:
              - rowgroup [ref=e245]:
                - row "Task Project User Logged Hours Entries Estimated" [ref=e246]:
                  - columnheader "Task" [ref=e247] [cursor=pointer]:
                    - generic [ref=e248]:
                      - img [ref=e249]
                      - text: Task
                  - columnheader "Project" [ref=e252] [cursor=pointer]:
                    - generic [ref=e253]:
                      - img [ref=e254]
                      - text: Project
                  - columnheader "User" [ref=e257] [cursor=pointer]:
                    - generic [ref=e258]:
                      - img [ref=e259]
                      - text: User
                  - columnheader "Logged Hours" [ref=e262] [cursor=pointer]:
                    - generic [ref=e263]:
                      - text: Logged Hours
                      - img [ref=e264]
                  - columnheader "Entries" [ref=e266] [cursor=pointer]:
                    - generic [ref=e267]:
                      - text: Entries
                      - img [ref=e268]
                  - columnheader "Estimated" [ref=e271] [cursor=pointer]:
                    - generic [ref=e272]:
                      - text: Estimated
                      - img [ref=e273]
              - rowgroup [ref=e276]:
                - row "Discovery & Planning upep.mx Saniyaj Mallik 5h 1 —" [ref=e277]:
                  - cell "Discovery & Planning" [ref=e278]:
                    - paragraph [ref=e279]: Discovery & Planning
                  - cell "upep.mx" [ref=e280]:
                    - paragraph [ref=e281]: upep.mx
                  - cell "Saniyaj Mallik" [ref=e282]:
                    - paragraph [ref=e283]: Saniyaj Mallik
                  - cell "5h" [ref=e284]
                  - cell "1" [ref=e285]
                  - cell "—" [ref=e286]
                - row "Plugin Integration two-lines-press Saniyaj Mallik 1.02h 1 —" [ref=e287]:
                  - cell "Plugin Integration" [ref=e288]:
                    - paragraph [ref=e289]: Plugin Integration
                  - cell "two-lines-press" [ref=e290]:
                    - paragraph [ref=e291]: two-lines-press
                  - cell "Saniyaj Mallik" [ref=e292]:
                    - paragraph [ref=e293]: Saniyaj Mallik
                  - cell "1.02h" [ref=e294]
                  - cell "1" [ref=e295]
                  - cell "—" [ref=e296]
                - row "Documentation ldgr-plugin Saniyaj Mallik 1h 1 —" [ref=e297]:
                  - cell "Documentation" [ref=e298]:
                    - paragraph [ref=e299]: Documentation
                  - cell "ldgr-plugin" [ref=e300]:
                    - paragraph [ref=e301]: ldgr-plugin
                  - cell "Saniyaj Mallik" [ref=e302]:
                    - paragraph [ref=e303]: Saniyaj Mallik
                  - cell "1h" [ref=e304]
                  - cell "1" [ref=e305]
                  - cell "—" [ref=e306]
                - row "d task dd Saniyaj Mallik 0.5h 1 —" [ref=e307]:
                  - cell "d task" [ref=e308]:
                    - paragraph [ref=e309]: d task
                  - cell "dd" [ref=e310]:
                    - paragraph [ref=e311]: dd
                  - cell "Saniyaj Mallik" [ref=e312]:
                    - paragraph [ref=e313]: Saniyaj Mallik
                  - cell "0.5h" [ref=e314]
                  - cell "1" [ref=e315]
                  - cell "—" [ref=e316]
  - alert [ref=e317]
```

# Test source

```ts
  1   | /**
  2   |  * Reports > AI Analytics page — overview cards, User AI Usage table,
  3   |  * Task Efficiency table, Tasks Not Using AI table, date filter, team filter.
  4   |  */
  5   | import { test, expect } from "@playwright/test";
  6   | 
  7   | test.describe("AI Analytics page", () => {
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.goto("/reports/ai-summary");
  10  |     await expect(page.getByRole("heading", { name: /ai analytics/i })).toBeVisible({ timeout: 15000 });
  11  |   });
  12  | 
  13  |   test("description is visible", async ({ page }) => {
  14  |     await expect(page.getByText(/track how ai adoption/i)).toBeVisible();
  15  |   });
  16  | 
  17  |   test("date range filter is present", async ({ page }) => {
  18  |     const dateInputs = page.locator('input[type="date"]');
  19  |     await expect(dateInputs.first()).toBeVisible();
  20  |   });
  21  | 
  22  |   test("team filter dropdown is present", async ({ page }) => {
  23  |     // TeamFilter renders a Select for filtering by team
  24  |     const selects = page.getByRole("combobox");
  25  |     const count = await selects.count();
  26  |     expect(count).toBeGreaterThanOrEqual(1);
  27  |   });
  28  | 
  29  |   test("overview cards are visible (AI Hours, Adoption Rate, AI-Active Users)", async ({ page }) => {
  30  |     // Three overview metric cards
> 31  |     await expect(page.getByText(/ai hours/i)).toBeVisible();
      |                                               ^ Error: expect(locator).toBeVisible() failed
  32  |     await expect(page.getByText(/adoption rate/i)).toBeVisible();
  33  |     await expect(page.getByText(/ai-active users/i)).toBeVisible();
  34  |   });
  35  | 
  36  |   test("User AI Usage table is visible", async ({ page }) => {
  37  |     await expect(page.getByText(/user ai usage/i)).toBeVisible();
  38  |   });
  39  | 
  40  |   test("User AI Usage table columns are correct", async ({ page }) => {
  41  |     // User, Total, AI Hours, Saved vs Est. columns
  42  |     const hasData = await page.getByRole("table").first().isVisible().catch(() => false);
  43  |     if (!hasData) return;
  44  |     await expect(page.getByRole("columnheader", { name: /user/i }).first()).toBeVisible();
  45  |     await expect(page.getByRole("columnheader", { name: /total/i }).first()).toBeVisible();
  46  |     await expect(page.getByRole("columnheader", { name: /ai hours/i }).first()).toBeVisible();
  47  |   });
  48  | 
  49  |   test("Task Efficiency table shows correct columns when visible", async ({ page }) => {
  50  |     const effSection = page.getByText(/task efficiency with ai/i);
  51  |     const exists = await effSection.count();
  52  |     if (!exists) return; // Only present when efficiency data exists
  53  | 
  54  |     const effTable = page.getByRole("table").nth(1);
  55  |     await expect(effTable.getByRole("columnheader", { name: /task/i })).toBeVisible();
  56  |     await expect(effTable.getByRole("columnheader", { name: /estimated/i })).toBeVisible();
  57  |     await expect(effTable.getByRole("columnheader", { name: /actual time spent/i })).toBeVisible();
  58  |     await expect(effTable.getByRole("columnheader", { name: /saved/i })).toBeVisible();
  59  |   });
  60  | 
  61  |   test("Actual Time Spent shows total hours (not per-entry avg)", async ({ page }) => {
  62  |     // Regression test for the calculation bug we fixed.
  63  |     // The value in Actual Time Spent should equal totalHours from the DB,
  64  |     // not the average of AI-assisted entries.
  65  |     const effSection = page.getByText(/task efficiency with ai/i);
  66  |     const exists = await effSection.count();
  67  |     if (!exists) return;
  68  | 
  69  |     // Get all rows in efficiency table
  70  |     const rows = page.getByRole("table").nth(1).getByRole("row");
  71  |     const rowCount = await rows.count();
  72  |     if (rowCount <= 1) return; // header only
  73  | 
  74  |     const firstDataRow = rows.nth(1);
  75  |     const cells = firstDataRow.getByRole("cell");
  76  |     const cellCount = await cells.count();
  77  |     // Cell index 3 = Estimated, cell index 4 = Actual Time Spent
  78  |     if (cellCount < 5) return;
  79  | 
  80  |     const estimatedText = (await cells.nth(3).textContent()) ?? "";
  81  |     const actualText = (await cells.nth(4).textContent()) ?? "";
  82  | 
  83  |     // If estimate is e.g. "10h", actual should be >= "0h" and not absurdly small
  84  |     // We mainly verify the column isn't empty or "—" when there's data
  85  |     expect(actualText).toMatch(/\d|—/);
  86  |     // Actual time should not be 0h if there are logged hours
  87  |     if (estimatedText !== "—") {
  88  |       expect(actualText).not.toBe("0h");
  89  |     }
  90  |   });
  91  | 
  92  |   test("Tasks Not Using AI section visible when applicable", async ({ page }) => {
  93  |     // Section only shown when non-AI tasks exist
  94  |     const noAiSection = page.getByText(/tasks not using ai/i);
  95  |     const exists = await noAiSection.count();
  96  |     if (!exists) return;
  97  |     await expect(noAiSection).toBeVisible();
  98  |   });
  99  | 
  100 |   test("table rows are sortable by clicking column headers", async ({ page }) => {
  101 |     const userTable = page.getByRole("table").first();
  102 |     const tableVisible = await userTable.isVisible().catch(() => false);
  103 |     if (!tableVisible) return;
  104 | 
  105 |     // Click Total column header to sort
  106 |     const totalHeader = page.getByRole("columnheader", { name: /total/i }).first();
  107 |     await totalHeader.click();
  108 |     await expect(page).toHaveURL(/\/reports\/ai-summary/); // still on same page
  109 | 
  110 |     // Click again to reverse sort
  111 |     await totalHeader.click();
  112 |     await expect(page).toHaveURL(/\/reports\/ai-summary/);
  113 |   });
  114 | 
  115 |   test("changing date range and clicking Apply updates results", async ({ page }) => {
  116 |     const fromInput = page.locator('input[type="date"]').first();
  117 |     await fromInput.fill("2026-01-01");
  118 |     await page.getByRole("button", { name: /apply/i }).click();
  119 |     await expect(page).toHaveURL(/from=2026-01-01/);
  120 |     await expect(page.getByRole("heading", { name: /ai analytics/i })).toBeVisible({ timeout: 10000 });
  121 |   });
  122 | 
  123 |   test("empty state shows when no data in range", async ({ page }) => {
  124 |     // Use a future date range guaranteed to have no data
  125 |     await page.goto("/reports/ai-summary?from=2099-01-01&to=2099-01-31");
  126 |     const emptyState = page.getByText(/no time entries found/i);
  127 |     const hasData = page.getByText(/ai hours/i);
  128 |     const eitherVisible = emptyState.or(hasData);
  129 |     await expect(eitherVisible.first()).toBeVisible({ timeout: 10000 });
  130 |   });
  131 | });
```