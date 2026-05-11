# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-reports-team.spec.ts >> Team Overview page >> team management description is visible
- Location: tests\e2e\08-reports-team.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/manage teams|collaboration/i)
Expected: visible
Error: strict mode violation: getByText(/manage teams|collaboration/i) resolved to 2 elements:
    1) <p class="text-sm text-muted-foreground mt-1">Manage teams and collaborate with your colleagues</p> aka getByText('Manage teams and collaborate')
    2) <p class="text-sm text-muted-foreground">Create and manage teams for collaboration</p> aka getByText('Create and manage teams for')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/manage teams|collaboration/i)

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
            - generic [ref=e70]: U
            - generic [ref=e71]:
              - paragraph
              - generic [ref=e72]: dev
          - generic [ref=e73]:
            - generic [ref=e74]:
              - link [ref=e75] [cursor=pointer]:
                - /url: /profile
                - button [ref=e76]:
                  - img
              - button [ref=e77] [cursor=pointer]:
                - img
            - button "Toggle theme" [ref=e78] [cursor=pointer]:
              - img
    - main [ref=e79]:
      - generic [ref=e81]:
        - generic [ref=e83]:
          - heading "Team Overview" [level=1] [ref=e84]
          - paragraph [ref=e85]: Manage teams and collaborate with your colleagues
        - generic [ref=e87]:
          - generic [ref=e88]:
            - heading "Teams" [level=2] [ref=e89]
            - paragraph [ref=e90]: Create and manage teams for collaboration
          - button "Create Team" [ref=e91] [cursor=pointer]:
            - img
            - text: Create Team
  - alert [ref=e111]
```

# Test source

```ts
  1  | /**
  2  |  * Reports > Team Overview page — team management section, create/delete team.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | 
  6  | const UNIQUE_TEAM = `E2E Team ${Date.now()}`;
  7  | 
  8  | test.describe("Team Overview page", () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     await page.goto("/reports/team");
  11 |     await expect(page.getByRole("heading", { name: /team overview/i })).toBeVisible({ timeout: 15000 });
  12 |   });
  13 | 
  14 |   test("team management description is visible", async ({ page }) => {
> 15 |     await expect(page.getByText(/manage teams|collaboration/i)).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  16 |   });
  17 | 
  18 |   test("Create Team button is visible", async ({ page }) => {
  19 |     await expect(page.getByRole("button", { name: /create team/i })).toBeVisible();
  20 |   });
  21 | 
  22 |   test("Create Team modal opens with name and description fields", async ({ page }) => {
  23 |     await page.getByRole("button", { name: /create team/i }).click();
  24 |     const dialog = page.getByRole("dialog");
  25 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  26 |     await expect(dialog.getByLabel(/team name/i).or(dialog.getByLabel(/name/i)).first()).toBeVisible();
  27 |   });
  28 | 
  29 |   test("Create Team modal closes on Cancel", async ({ page }) => {
  30 |     await page.getByRole("button", { name: /create team/i }).click();
  31 |     await expect(page.getByRole("dialog")).toBeVisible();
  32 |     await page.getByRole("button", { name: /cancel/i }).click();
  33 |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  34 |   });
  35 | 
  36 |   test("teams grid or empty state is shown", async ({ page }) => {
  37 |     // Either team cards or empty state message
  38 |     const hasTeams = await page.locator('[class*="card"], [class*="Card"]').count();
  39 |     const hasEmpty = await page.getByText(/no teams yet|create.*team/i).count();
  40 |     expect(hasTeams + hasEmpty).toBeGreaterThan(0);
  41 |   });
  42 | 
  43 |   test("each team card shows team name and leader", async ({ page }) => {
  44 |     const cards = page.locator('[class*="card"], [class*="Card"]').filter({
  45 |       has: page.locator('text=/leader/i'),
  46 |     });
  47 |     const cardCount = await cards.count();
  48 |     if (cardCount === 0) return; // No teams yet — skip deeper checks
  49 |     await expect(cards.first()).toBeVisible();
  50 |   });
  51 | });
  52 | 
  53 | test.describe("Team - Create and Delete flow", () => {
  54 |   test("can create a team and see it listed", async ({ page }) => {
  55 |     await page.goto("/reports/team");
  56 |     await page.getByRole("button", { name: /create team/i }).click();
  57 |     const dialog = page.getByRole("dialog");
  58 |     await expect(dialog).toBeVisible();
  59 | 
  60 |     const nameInput = dialog.getByLabel(/team name/i).or(dialog.getByLabel(/name/i)).first();
  61 |     await nameInput.fill(UNIQUE_TEAM);
  62 | 
  63 |     await dialog.getByRole("button", { name: /create/i }).click();
  64 |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  65 | 
  66 |     // Team card should appear
  67 |     await expect(page.getByText(UNIQUE_TEAM)).toBeVisible({ timeout: 10000 });
  68 |   });
  69 | 
  70 |   test("team leader can add a member", async ({ page }) => {
  71 |     await page.goto("/reports/team");
  72 | 
  73 |     // Find the team card for our E2E team
  74 |     const teamCard = page.locator('[class*="card"], [class*="Card"]').filter({
  75 |       has: page.getByText(UNIQUE_TEAM),
  76 |     }).first();
  77 |     const exists = await teamCard.count();
  78 |     if (!exists) return;
  79 | 
  80 |     // Add member button should be visible on the card
  81 |     const addBtn = teamCard.getByRole("button", { name: /add member/i });
  82 |     const addBtnExists = await addBtn.count();
  83 |     if (!addBtnExists) return;
  84 | 
  85 |     await addBtn.click();
  86 |     const dialog = page.getByRole("dialog");
  87 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  88 |     await expect(dialog.getByRole("combobox").first()).toBeVisible();
  89 |   });
  90 | });
  91 | 
```