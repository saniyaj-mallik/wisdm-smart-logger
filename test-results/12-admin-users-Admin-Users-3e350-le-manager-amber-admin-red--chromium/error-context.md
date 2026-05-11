# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-admin-users.spec.ts >> Admin Users page >> role badges are color-coded (dev=blue, sme=purple, manager=amber, admin=red)
- Location: tests\e2e\12-admin-users.spec.ts:91:7

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /red/i
Received string:  "px-3 mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
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
          - heading "Users" [level=1] [ref=e85]
          - paragraph [ref=e86]: Manage team members and their roles
        - table [ref=e89]:
          - rowgroup [ref=e90]:
            - row "Name Email Role Status Joined" [ref=e91]:
              - columnheader "Name" [ref=e92]
              - columnheader "Email" [ref=e93]
              - columnheader "Role" [ref=e94]
              - columnheader "Status" [ref=e95]
              - columnheader "Joined" [ref=e96]
              - columnheader [ref=e97]
          - rowgroup [ref=e98]:
            - row "E2E Test User e2etest@wisdmlabs.com admin Active 5/11/2026" [ref=e99]:
              - cell "E2E Test User" [ref=e100]
              - cell "e2etest@wisdmlabs.com" [ref=e101]
              - cell "admin" [ref=e102]
              - cell "Active" [ref=e103]
              - cell "5/11/2026" [ref=e104]
              - cell [ref=e105]:
                - button [ref=e106] [cursor=pointer]:
                  - img
            - row "Saniyaj Mallik saniyaj@test.com dev Active 5/8/2026" [ref=e107]:
              - cell "Saniyaj Mallik" [ref=e108]
              - cell "saniyaj@test.com" [ref=e109]
              - cell "dev" [ref=e110]
              - cell "Active" [ref=e111]
              - cell "5/8/2026" [ref=e112]
              - cell [ref=e113]:
                - button [ref=e114] [cursor=pointer]:
                  - img
            - row "Admin User admin@wisdmlabs.com admin Active 5/7/2026" [ref=e115]:
              - cell "Admin User" [ref=e116]
              - cell "admin@wisdmlabs.com" [ref=e117]
              - cell "admin" [ref=e118]
              - cell "Active" [ref=e119]
              - cell "5/7/2026" [ref=e120]
              - cell [ref=e121]:
                - button [ref=e122] [cursor=pointer]:
                  - img
  - alert [ref=e123]
  - generic [ref=e126] [cursor=pointer]:
    - img [ref=e127]
    - generic [ref=e129]: 2 errors
    - button "Hide Errors" [ref=e130]:
      - img [ref=e131]
```

# Test source

```ts
  1   | /**
  2   |  * Admin > Users page — user table, edit user modal, role and status changes.
  3   |  * Test user is admin, so all features should be accessible.
  4   |  */
  5   | import { test, expect } from "@playwright/test";
  6   | import { TEST_USER } from "../../playwright.config";
  7   | 
  8   | test.describe("Admin Users page", () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     await page.goto("/admin/users");
  11  |     await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({ timeout: 15000 });
  12  |   });
  13  | 
  14  |   test("page description is visible", async ({ page }) => {
  15  |     await expect(page.getByText(/manage team members and their roles/i)).toBeVisible();
  16  |   });
  17  | 
  18  |   test("users table is visible with correct column headers", async ({ page }) => {
  19  |     const table = page.getByRole("table");
  20  |     await expect(table).toBeVisible();
  21  |     await expect(table.getByRole("columnheader", { name: /name/i })).toBeVisible();
  22  |     await expect(table.getByRole("columnheader", { name: /email/i })).toBeVisible();
  23  |     await expect(table.getByRole("columnheader", { name: /role/i })).toBeVisible();
  24  |     await expect(table.getByRole("columnheader", { name: /status/i })).toBeVisible();
  25  |     await expect(table.getByRole("columnheader", { name: /joined/i })).toBeVisible();
  26  |   });
  27  | 
  28  |   test("at least one user row is visible (the test user itself)", async ({ page }) => {
  29  |     await expect(page.getByText(TEST_USER.email)).toBeVisible();
  30  |   });
  31  | 
  32  |   test("test user row shows Admin role badge", async ({ page }) => {
  33  |     const userRow = page.getByRole("row").filter({ has: page.getByText(TEST_USER.email) });
  34  |     await expect(userRow.getByText(/admin/i)).toBeVisible();
  35  |   });
  36  | 
  37  |   test("test user row shows Active status", async ({ page }) => {
  38  |     const userRow = page.getByRole("row").filter({ has: page.getByText(TEST_USER.email) });
  39  |     await expect(userRow.getByText(/active/i)).toBeVisible();
  40  |   });
  41  | 
  42  |   test("edit button is visible on user rows", async ({ page }) => {
  43  |     const editBtns = page.getByRole("button").filter({ has: page.locator('svg') });
  44  |     // At least one edit button (pencil icon) should exist
  45  |     await expect(editBtns.first()).toBeVisible();
  46  |   });
  47  | 
  48  |   test("Edit User modal opens with correct fields", async ({ page }) => {
  49  |     // Find any user row and click its edit button
  50  |     const rows = page.getByRole("row");
  51  |     const rowCount = await rows.count();
  52  |     // Skip header row (index 0), try first data row
  53  |     if (rowCount < 2) return;
  54  |     const editBtn = rows.nth(1).getByRole("button");
  55  |     const btnCount = await editBtn.count();
  56  |     if (!btnCount) return;
  57  |     await editBtn.click();
  58  |     const dialog = page.getByRole("dialog");
  59  |     await expect(dialog).toBeVisible({ timeout: 5000 });
  60  |     // Should show role and status fields
  61  |     await expect(dialog.getByText(/role/i)).toBeVisible();
  62  |     await expect(dialog.getByText(/active/i)).toBeVisible();
  63  |   });
  64  | 
  65  |   test("Edit User modal has Cancel and Save buttons", async ({ page }) => {
  66  |     const rows = page.getByRole("row");
  67  |     const rowCount = await rows.count();
  68  |     if (rowCount < 2) return;
  69  |     const editBtn = rows.nth(1).getByRole("button");
  70  |     const btnCount = await editBtn.count();
  71  |     if (!btnCount) return;
  72  |     await editBtn.click();
  73  |     const dialog = page.getByRole("dialog");
  74  |     await expect(dialog).toBeVisible({ timeout: 5000 });
  75  |     await expect(dialog.getByRole("button", { name: /cancel/i })).toBeVisible();
  76  |     await expect(dialog.getByRole("button", { name: /save/i })).toBeVisible();
  77  |   });
  78  | 
  79  |   test("Edit User modal closes on Cancel", async ({ page }) => {
  80  |     const rows = page.getByRole("row");
  81  |     const rowCount = await rows.count();
  82  |     if (rowCount < 2) return;
  83  |     const editBtn = rows.nth(1).getByRole("button");
  84  |     if (!await editBtn.count()) return;
  85  |     await editBtn.click();
  86  |     await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  87  |     await page.getByRole("button", { name: /cancel/i }).click();
  88  |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  89  |   });
  90  | 
  91  |   test("role badges are color-coded (dev=blue, sme=purple, manager=amber, admin=red)", async ({ page }) => {
  92  |     const adminBadge = page.getByText(/admin/i).first();
  93  |     await expect(adminBadge).toBeVisible();
  94  |     const cls = await adminBadge.getAttribute("class") ?? "";
> 95  |     expect(cls).toMatch(/red/i);
      |                 ^ Error: expect(received).toMatch(expected)
  96  |   });
  97  | });
  98  | 
  99  | // Non-admin users cannot access admin page
  100 | test.describe("Admin page access control", () => {
  101 |   test("non-admin users are redirected or see no admin nav", async ({ page }) => {
  102 |     // Our test user IS admin, so this just verifies the link is present for admin
  103 |     await page.goto("/dashboard");
  104 |     await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
  105 |   });
  106 | });
  107 | 
```