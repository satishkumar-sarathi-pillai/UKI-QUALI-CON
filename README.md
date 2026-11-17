# UKI-QUALI-CON: AI-Augmented QA with IBM Bob, Jira MCP and Playwright

A 20-minute hands-on workshop. IBM Bob reads a user story and its test cases from IBM Jira
(via the Model Context Protocol), then generates, runs and extends Playwright tests for
[SauceDemo](https://www.saucedemo.com).

| Jira key | What it is |
|---|---|
| [UKIQC-1](https://ibm-consulting-sandbox003.atlassian.net/browse/UKIQC-1) | Story: Shopping Cart - Add Items and Verify Checkout Calculation |
| [UKIQC-2](https://ibm-consulting-sandbox003.atlassian.net/browse/UKIQC-2) | TC1: Add two items and verify cart badge shows 2 |
| [UKIQC-3](https://ibm-consulting-sandbox003.atlassian.net/browse/UKIQC-3) | TC2: Checkout overview shows consistent Item Total, Tax and Total |
| [UKIQC-4](https://ibm-consulting-sandbox003.atlassian.net/browse/UKIQC-4) | TC3: Blank Postal Code shows required error (the mid-sprint change) |

Jira board: https://ibm-consulting-sandbox003.atlassian.net/jira/software/projects/UKIQC/boards/2198/backlog

---

## Part 1 - Pre-read (do this BEFORE the session)

The live session does not cover installation or connection setup. Please complete every step
below and run the smoke test at the end. It takes about 10-15 minutes.

### 1. Install the tools
- [Node.js](https://nodejs.org) 20 or later (`node -v`)
- Git (`git --version`)
- IBM Bob

### 2. Clone the repo and install dependencies
```bash
git clone <REPO_URL>
cd UKI-QUALI-CON
npm install
npx playwright install chromium
```

### 3. Create your own Jira API token
1. Sign in to the sandbox site: https://ibm-consulting-sandbox003.atlassian.net
2. Open https://id.atlassian.com/manage-profile/security/api-tokens and create a token.
3. Keep it private. Never paste it into chat, a ticket or a file in this repo.

### 4. Add the Jira MCP server in IBM Bob
Add an `atlassian-jira` server in Bob's MCP settings (`~/.bob/settings/mcp.json`) using the
`mcp-atlassian` package. The values that matter:

| Setting | Value |
|---|---|
| `ATLASSIAN_BASE_URL` | `https://ibm-consulting-sandbox003.atlassian.net` |
| `ATLASSIAN_EMAIL` | the email you use on the sandbox site |
| `ATLASSIAN_API_TOKEN` | the token from step 3 |

> The most common failure is a **wrong base URL or a token from a different Jira site**.
> Symptoms are `Cannot read properties of undefined (reading 'map')` errors, or a profile URL
> that does not contain `ibm-consulting-sandbox003`.

Reload the MCP server in Bob after saving.

### 5. Smoke test (must pass before the session)
Paste this into IBM Bob:

```text
Using the Jira MCP server, tell me who I am logged in as and confirm you can read ticket UKIQC-1.
```

Expected: your name, your profile URL on `ibm-consulting-sandbox003.atlassian.net`, and the
UKIQC-1 summary.

### Known limitations of the Jira MCP server
- JQL search (`search_jira_issues`) and "my unresolved issues" currently fail.
  **Always name ticket keys in your prompts** (UKIQC-1, UKIQC-2, UKIQC-3, UKIQC-4).
- Reading a single ticket by key works.
- Parent/child links are not returned by `read_jira_issue`. Check them in the Jira UI.

### If your MCP will not connect
Do not worry. Open the tickets in your browser, paste the text into your prompts, and follow
along. Everything after Step 3 of the live session works without MCP.

---

## Part 2 - Live runbook (20 minutes)

The presenter drives. Follow along at your own pace, and it is fine to just watch and paste
prompts afterwards. Bob's output will differ slightly from the presenter's.

| Min | Step | Goal |
|---|---|---|
| 0-2 | 1. Hook and smoke test | Show Bob reading Jira directly |
| 2-5 | 2. Retrieve the story | Requirements from Jira, with gaps flagged |
| 5-7 | 3. Look at the tests | Test cases UKIQC-2 / UKIQC-3 vs the acceptance criteria |
| 7-11 | 4. Generate the Playwright test | Resilient, requirement-driven code |
| 11-14 | 5. Run headed and review | Watch the browser, open the report |
| 14-19 | 6. Requirement change | Add a negative test from UKIQC-4 |
| 19-20 | 7. Q&A | Optional: failure to Jira bug |

### Step 1 - Hook and smoke test (0-2 min)
Today a requirement travels by copy and paste: ticket, then a document, then a test. Here Bob
reads the ticket itself and you review each step.

```text
Using the Jira MCP server, tell me who I am logged in as and confirm you can read ticket UKIQC-1.
```

### Step 2 - Retrieve the story (2-5 min)
```text
Using the Jira MCP server, read UKIQC-1. Summarise the user journey, list the acceptance criteria and highlight anything not specified. Do not infer missing requirements.
```
**Point out:** the expected Item Total, Tax and Total are NOT specified. This is a flagged
requirement gap. We will test relationships, not invented numbers.

### Step 3 - Look at the associated tests (5-7 min)
```text
Read UKIQC-2 and UKIQC-3 with the Jira MCP server. These are test cases for UKIQC-1. Show their steps and expected results side by side with the acceptance criteria and note any gaps.
```
**Point out:** test cases live in Jira as Subtasks. They are the bridge between the
requirement and the automation.

### Step 4 - Generate the Playwright test (7-11 min)
```text
Based on UKIQC-1, UKIQC-2 and UKIQC-3, create tests/checkout-calculation.spec.js for https://www.saucedemo.com using Playwright JavaScript. Prefer data-test locators over CSS or XPath. Name each test after its Jira key. Do not invent expected prices or tax: assert only that Item Total equals the sum of the item prices and that Total equals Item Total plus Tax. Flag any unresolved expected values.
```
**Point out:** `data-test` locators, integer-cent maths to avoid rounding errors, and the
gap comment at the top of the file.

> A reference version of this file is already in the repo. If you are following along in the
> cloned repo, ask Bob to write to a new name (for example
> `tests/checkout-calculation-live.spec.js`) so you do not overwrite it.

### Step 5 - Run headed and review (11-14 min)
```text
Run tests/checkout-calculation.spec.js in headed Chromium, then open the HTML report. Summarise the results from the actual output, including any failures and likely causes. Do not claim a test passed unless the run confirms it.
```
Fallback commands:
```bash
npx playwright test tests/checkout-calculation.spec.js --headed
npx playwright show-report
```
`playwright.config.js` already sets `slowMo: 500` and records a video of every test, so open a
test in the report and look under **Attachments**.

### Step 6 - Requirement change (14-19 min)
The product owner has added a negative case, already written up as UKIQC-4.

```text
The product owner has added a requirement. Read UKIQC-4 with the Jira MCP server. Add a third test to tests/checkout-calculation.spec.js for it: leave Postal Code blank at checkout and assert that "Error: Postal Code is required" is displayed and the user stays on the checkout information page. Keep the existing tests unchanged, explain the change before applying it, then run only the new test.
```
Run only the new test yourself with:
```bash
npx playwright test tests/checkout-calculation.spec.js --headed -g "UKIQC-4"
```
(The test title must contain `UKIQC-4`. Name it in the style of the others, for example
`UKIQC-4 TC3 postal code required`.)

### Step 7 - Q&A (19-20 min)
Optional, if a test failed and time allows:
```text
One of the tests failed. Draft a Jira bug for it in project UKIQC, include the steps, expected and actual result, and show it to me before creating anything.
```
Bob will not create a Jira issue unless you explicitly tell it to.

---

## Project layout
```
playwright.config.js              headed Chromium, slowMo, HTML report, video on
tests/checkout-calculation.spec.js  reference tests (UKIQC-2 and UKIQC-3)
package.json                      Playwright 1.65.1
```

## Notes and caveats
- **Pound symbol (presentation only):** the spec rewrites `$` to `£` on screen for a UK
  audience. SauceDemo has no currency setting, so this changes the **symbol only** and the
  numbers are NOT converted. It is not a requirement from UKIQC-1.
- **A passing test shows consistency, not correctness:** the tax rule and expected totals are
  still an open requirement for the Product Owner.
- **Reports and videos are git-ignored** (`test-results/`, `playwright-report/`).
- **Secrets:** never commit API tokens, `.env` files or your `mcp.json`.
- **Facilitators:** if you share your screen, do not open `~/.bob/settings/mcp.json`.
  It contains your token.
