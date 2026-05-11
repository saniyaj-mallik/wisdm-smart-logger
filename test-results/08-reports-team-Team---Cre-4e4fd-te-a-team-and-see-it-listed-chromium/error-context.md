# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-reports-team.spec.ts >> Team - Create and Delete flow >> can create a team and see it listed
- Location: tests\e2e\08-reports-team.spec.ts:54:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('dialog').getByRole('button', { name: /create/i })
    - locator resolved to <button type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full">Create Team</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - button "next" [disabled] [ref=e11]:
            - img "next" [ref=e12]
          - generic [ref=e14]: 1 of 1 error
          - generic [ref=e15]:
            - text: Next.js (14.2.35) is outdated
            - link "(learn more)" [ref=e17] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - button "Close" [ref=e18] [cursor=pointer]:
          - img [ref=e20]
      - heading "Unhandled Runtime Error" [level=1] [ref=e23]
      - paragraph [ref=e24]: "TypeError: Cannot read properties of null (reading '_id')"
    - generic [ref=e25]:
      - heading "Source" [level=2] [ref=e26]
      - generic [ref=e27]:
        - link "components\\teams\\TeamManagementSection.tsx (101:34) @ _id" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: components\teams\TeamManagementSection.tsx (101:34) @ _id
          - img [ref=e31]
        - generic [ref=e35]: "99 | onTeamDelete: (teamId: string) => void; 100 | }) { > 101 | const isLeader = team.leaderId._id === currentUserId; | ^ 102 | const [addMemberOpen, setAddMemberOpen] = useState(false); 103 | const [removing, setRemoving] = useState<string | null>(null); 104 | const [deleting, setDeleting] = useState(false);"
      - heading "Call Stack" [level=2] [ref=e36]
      - button "Show collapsed frames" [ref=e37] [cursor=pointer]
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
  15 |     await expect(page.getByText(/manage teams|collaboration/i)).toBeVisible();
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
> 63 |     await dialog.getByRole("button", { name: /create/i }).click();
     |                                                           ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
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