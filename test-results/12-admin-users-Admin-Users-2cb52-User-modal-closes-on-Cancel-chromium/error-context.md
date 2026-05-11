# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-admin-users.spec.ts >> Admin Users page >> Edit User modal closes on Cancel
- Location: tests\e2e\12-admin-users.spec.ts:79:7

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
          - generic:
            - generic:
              - heading [level=1]: Users
              - paragraph: Manage team members and their roles
          - generic:
            - generic:
              - table:
                - rowgroup:
                  - row:
                    - columnheader: Name
                    - columnheader: Email
                    - columnheader: Role
                    - columnheader: Status
                    - columnheader: Joined
                    - columnheader
                - rowgroup:
                  - row:
                    - cell: E2E Test User
                    - cell: e2etest@wisdmlabs.com
                    - cell: admin
                    - cell: Active
                    - cell: 5/11/2026
                    - cell:
                      - button:
                        - img
                  - row:
                    - cell: Saniyaj Mallik
                    - cell: saniyaj@test.com
                    - cell: dev
                    - cell: Active
                    - cell: 5/8/2026
                    - cell:
                      - button:
                        - img
                  - row:
                    - cell: Admin User
                    - cell: admin@wisdmlabs.com
                    - cell: admin
                    - cell: Active
                    - cell: 5/7/2026
                    - cell:
                      - button:
                        - img
  - alert
  - generic [ref=e3] [cursor=pointer]:
    - img [ref=e4]
    - generic [ref=e6]: 2 errors
    - button [ref=e7]:
      - img [ref=e8]
  - dialog "Edit User" [ref=e12]:
    - heading "Edit User" [level=2] [ref=e14]
    - generic [ref=e15]:
      - generic [ref=e16]:
        - paragraph [ref=e17]: E2E Test User
        - paragraph [ref=e18]: e2etest@wisdmlabs.com
      - generic [ref=e19]:
        - text: Role
        - combobox [active] [ref=e20] [cursor=pointer]:
          - generic: Admin
          - img [ref=e21]
        - combobox [ref=e23]
      - generic [ref=e24]:
        - text: Status
        - combobox [ref=e25] [cursor=pointer]:
          - generic: Active
          - img [ref=e26]
        - combobox [ref=e28]
      - button "Save changes" [ref=e29] [cursor=pointer]
    - button "Close" [ref=e30] [cursor=pointer]:
      - img [ref=e31]
      - generic [ref=e34]: Close
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
> 87  |     await page.getByRole("button", { name: /cancel/i }).click();
      |                                                         ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  88  |     await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  89  |   });
  90  | 
  91  |   test("role badges are color-coded (dev=blue, sme=purple, manager=amber, admin=red)", async ({ page }) => {
  92  |     const adminBadge = page.getByText(/admin/i).first();
  93  |     await expect(adminBadge).toBeVisible();
  94  |     const cls = await adminBadge.getAttribute("class") ?? "";
  95  |     expect(cls).toMatch(/red/i);
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