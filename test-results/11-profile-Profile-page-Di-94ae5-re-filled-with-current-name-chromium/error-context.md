# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-profile.spec.ts >> Profile page >> Display name field is pre-filled with current name
- Location: tests\e2e\11-profile.spec.ts:25:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
          - heading "Profile" [level=1] [ref=e85]
          - paragraph [ref=e86]: Update your account details
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]: Account settings
            - generic [ref=e90]: "Email: e2etest@wisdmlabs.com"
          - generic [ref=e92]:
            - generic [ref=e93]:
              - text: Display name
              - textbox "Display name" [ref=e94]: E2E Test User
            - generic [ref=e95]:
              - text: Current password
              - textbox "Current password" [ref=e96]
            - generic [ref=e97]:
              - text: New password
              - textbox "New password" [ref=e98]
            - button "Save changes" [ref=e99] [cursor=pointer]
  - alert [ref=e100]
```

# Test source

```ts
  1  | /**
  2  |  * Profile page — view account details, update display name, password change validation.
  3  |  */
  4  | import { test, expect } from "@playwright/test";
  5  | import { TEST_USER } from "../../playwright.config";
  6  | 
  7  | test.describe("Profile page", () => {
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await page.goto("/profile");
  10 |     await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible({ timeout: 15000 });
  11 |   });
  12 | 
  13 |   test("page description is visible", async ({ page }) => {
  14 |     await expect(page.getByText(/update your account details/i)).toBeVisible();
  15 |   });
  16 | 
  17 |   test("Account Settings card is visible", async ({ page }) => {
  18 |     await expect(page.getByText(/account settings/i)).toBeVisible();
  19 |   });
  20 | 
  21 |   test("user email is displayed", async ({ page }) => {
  22 |     await expect(page.getByText(TEST_USER.email)).toBeVisible();
  23 |   });
  24 | 
  25 |   test("Display name field is pre-filled with current name", async ({ page }) => {
  26 |     const nameInput = page.getByLabel(/display name/i);
  27 |     await expect(nameInput).toBeVisible();
  28 |     const value = await nameInput.inputValue();
> 29 |     expect(value.length).toBeGreaterThan(0);
     |                          ^ Error: expect(received).toBeGreaterThan(expected)
  30 |   });
  31 | 
  32 |   test("Current password field is visible", async ({ page }) => {
  33 |     await expect(page.getByLabel(/current password/i)).toBeVisible();
  34 |   });
  35 | 
  36 |   test("New password field is visible", async ({ page }) => {
  37 |     await expect(page.getByLabel(/new password/i)).toBeVisible();
  38 |   });
  39 | 
  40 |   test("Save Changes button is visible", async ({ page }) => {
  41 |     await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
  42 |   });
  43 | 
  44 |   test("can update display name successfully", async ({ page }) => {
  45 |     const nameInput = page.getByLabel(/display name/i);
  46 |     await nameInput.fill("E2E Test User");
  47 |     await page.getByRole("button", { name: /save changes/i }).click();
  48 |     await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  49 |   });
  50 | 
  51 |   test("shows error when new password provided without current password", async ({ page }) => {
  52 |     await page.getByLabel(/new password/i).fill("NewPass123!");
  53 |     // Don't fill current password
  54 |     await page.getByRole("button", { name: /save changes/i }).click();
  55 |     await expect(page.getByText(/current password required/i)).toBeVisible({ timeout: 8000 });
  56 |   });
  57 | 
  58 |   test("shows error when wrong current password is entered", async ({ page }) => {
  59 |     await page.getByLabel(/current password/i).fill("wrongpassword999");
  60 |     await page.getByLabel(/new password/i).fill("NewPass123!");
  61 |     await page.getByRole("button", { name: /save changes/i }).click();
  62 |     await expect(page.getByText(/incorrect|invalid|wrong|current password/i)).toBeVisible({ timeout: 8000 });
  63 |   });
  64 | 
  65 |   test("can change password with correct current password", async ({ page }) => {
  66 |     await page.getByLabel(/current password/i).fill(TEST_USER.password);
  67 |     await page.getByLabel(/new password/i).fill(TEST_USER.password); // keep same for idempotency
  68 |     await page.getByRole("button", { name: /save changes/i }).click();
  69 |     await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  70 |   });
  71 | });
  72 | 
```