# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-reports-block-generator.spec.ts >> Block Generator page >> Copy button is visible after report generation
- Location: tests\e2e\10-reports-block-generator.spec.ts:56:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /block generator/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: /block generator/i })

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
          - heading "Block Report Generator" [level=1] [ref=e85]
          - paragraph [ref=e86]: Generate a formatted time report ready to download or share
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]:
              - generic [ref=e90]:
                - generic [ref=e91]: "1"
                - generic [ref=e92]: Project & Dates
              - img [ref=e93]
            - generic [ref=e95]:
              - generic [ref=e96]:
                - generic [ref=e97]: "2"
                - generic [ref=e98]: Select Tasks
              - img [ref=e99]
            - generic [ref=e102]:
              - generic [ref=e103]: "3"
              - generic [ref=e104]: Download Report
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]:
                - text: Select Project
                - generic [ref=e109]:
                  - button "dd" [ref=e110] [cursor=pointer]:
                    - generic [ref=e112]: dd
                  - button "ldgr-plugin WisdmLabs" [ref=e113] [cursor=pointer]:
                    - generic [ref=e116]: ldgr-plugin
                    - paragraph [ref=e117]: WisdmLabs
                  - button "smart-logger-internal WisdmLabs" [ref=e118] [cursor=pointer]:
                    - generic [ref=e120]: smart-logger-internal
                    - paragraph [ref=e121]: WisdmLabs
                  - button "two-lines-press Two Lines Press" [ref=e122] [cursor=pointer]:
                    - generic [ref=e124]: two-lines-press
                    - paragraph [ref=e125]: Two Lines Press
                  - button "upep.mx UPEP" [ref=e126] [cursor=pointer]:
                    - generic [ref=e129]: upep.mx
                    - paragraph [ref=e130]: UPEP
                  - button "wisdmlabs-internal" [ref=e131] [cursor=pointer]:
                    - generic [ref=e133]: wisdmlabs-internal
              - generic [ref=e134]:
                - text: Date Range
                - generic [ref=e135]:
                  - text: From
                  - textbox [ref=e136]: 2026-05-11
                - generic [ref=e137]:
                  - text: To
                  - textbox [ref=e138]: 2026-05-11
            - generic [ref=e139]:
              - button "Next" [disabled]:
                - text: Next
                - img
  - alert [ref=e140]
```

# Test source

```ts
  1   | /**
  2   |  * Reports > Block Generator page — filters, format options, generate report, copy/download.
  3   |  */
  4   | import { test, expect } from "@playwright/test";
  5   | 
  6   | test.describe("Block Generator page", () => {
  7   |   test.beforeEach(async ({ page }) => {
  8   |     await page.goto("/reports/block-generator");
> 9   |     await expect(page.getByRole("heading", { name: /block generator/i })).toBeVisible({ timeout: 15000 });
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  10  |   });
  11  | 
  12  |   test("date range inputs are visible", async ({ page }) => {
  13  |     const dateInputs = page.locator('input[type="date"]');
  14  |     await expect(dateInputs.first()).toBeVisible();
  15  |     await expect(dateInputs.nth(1)).toBeVisible();
  16  |   });
  17  | 
  18  |   test("quick period shortcuts visible (This Week, Last Week, etc.)", async ({ page }) => {
  19  |     const shortcuts = ["this week", "last week", "this month", "last month"];
  20  |     let found = 0;
  21  |     for (const label of shortcuts) {
  22  |       if (await page.getByText(new RegExp(label, "i")).count()) found++;
  23  |     }
  24  |     expect(found).toBeGreaterThanOrEqual(2);
  25  |   });
  26  | 
  27  |   test("Group By filter is visible", async ({ page }) => {
  28  |     await expect(page.getByText(/group by/i)).toBeVisible();
  29  |   });
  30  | 
  31  |   test("Format selector is visible (Text / Markdown / CSV)", async ({ page }) => {
  32  |     await expect(page.getByText(/format/i)).toBeVisible();
  33  |     await expect(page.getByText(/text|markdown|csv|xlsx/i)).toBeVisible();
  34  |   });
  35  | 
  36  |   test("Billable filter is visible", async ({ page }) => {
  37  |     await expect(page.getByText(/billable/i)).toBeVisible();
  38  |   });
  39  | 
  40  |   test("Generate Report button is visible and clickable", async ({ page }) => {
  41  |     const generateBtn = page.getByRole("button", { name: /generate report/i });
  42  |     await expect(generateBtn).toBeVisible();
  43  |     await generateBtn.click();
  44  |     // Button may show a loader while generating
  45  |     await expect(page).toHaveURL(/\/reports\/block-generator/);
  46  |   });
  47  | 
  48  |   test("report output area appears after generating", async ({ page }) => {
  49  |     await page.getByRole("button", { name: /generate report/i }).click();
  50  |     // Wait for either the report output or a no-data message
  51  |     const outputArea = page.locator("pre, textarea, [class*='output'], [class*='result']");
  52  |     const noData = page.getByText(/no entries found|no data/i);
  53  |     await expect(outputArea.or(noData).first()).toBeVisible({ timeout: 15000 });
  54  |   });
  55  | 
  56  |   test("Copy button is visible after report generation", async ({ page }) => {
  57  |     await page.getByRole("button", { name: /generate report/i }).click();
  58  |     const copyBtn = page.getByRole("button", { name: /copy/i });
  59  |     const hasOutput = await copyBtn.isVisible({ timeout: 10000 }).catch(() => false);
  60  |     if (hasOutput) {
  61  |       await expect(copyBtn).toBeVisible();
  62  |     }
  63  |   });
  64  | 
  65  |   test("Download button is visible when there is data", async ({ page }) => {
  66  |     await page.getByRole("button", { name: /generate report/i }).click();
  67  |     const downloadBtn = page.getByRole("button", { name: /download/i });
  68  |     const hasDownload = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);
  69  |     if (hasDownload) {
  70  |       await expect(downloadBtn).toBeVisible();
  71  |     }
  72  |   });
  73  | 
  74  |   test("switching to Markdown format and generating produces different output", async ({ page }) => {
  75  |     // Select markdown format
  76  |     const formatSelects = page.getByRole("combobox");
  77  |     // Format is one of the select dropdowns — try to find it by context
  78  |     const formatRegion = page.locator('[class*="format"]').or(
  79  |       page.locator("label").filter({ hasText: /format/i }).locator("..")
  80  |     ).first();
  81  |     const select = formatRegion.getByRole("combobox");
  82  |     const selectCount = await select.count();
  83  |     if (selectCount > 0) {
  84  |       await select.click();
  85  |       const markdownOption = page.getByRole("option", { name: /markdown/i });
  86  |       const mdExists = await markdownOption.count();
  87  |       if (mdExists) await markdownOption.click();
  88  |     }
  89  |     await page.getByRole("button", { name: /generate report/i }).click();
  90  |     await expect(page).toHaveURL(/\/reports\/block-generator/);
  91  |   });
  92  | 
  93  |   test("custom date range works", async ({ page }) => {
  94  |     const dateInputs = page.locator('input[type="date"]');
  95  |     await dateInputs.first().fill("2026-01-01");
  96  |     await dateInputs.nth(1).fill("2026-01-31");
  97  |     await page.getByRole("button", { name: /generate report/i }).click();
  98  |     // Should still be on page (not crash)
  99  |     await expect(page).toHaveURL(/\/reports\/block-generator/);
  100 |     await expect(page.getByRole("heading", { name: /block generator/i })).toBeVisible({ timeout: 10000 });
  101 |   });
  102 | });
  103 | 
```