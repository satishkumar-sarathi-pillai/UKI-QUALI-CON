// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Jira story: UKIQC-1 - Shopping Cart - Add Items and Verify Checkout Calculation
 * Test cases:  UKIQC-2 (TC1) and UKIQC-3 (TC2)
 * Application: https://www.saucedemo.com
 *
 * REQUIREMENT GAP (flagged in UKIQC-1 / UKIQC-3):
 * The expected Item Total, Tax and Total values and the tax rule have NOT been
 * specified by the Product Owner. This suite therefore asserts only the
 * relationships that ARE specified (Item Total = sum of item prices,
 * Total = Item Total + Tax) and that Tax is present and a valid amount.
 * No fixed currency values or tax rate are asserted.
 */

const USER = { username: 'standard_user', password: 'secret_sauce' };
const ITEMS = [
  { name: 'Sauce Labs Backpack', slug: 'sauce-labs-backpack' },
  { name: 'Sauce Labs Bike Light', slug: 'sauce-labs-bike-light' },
];
const CHECKOUT = { firstName: 'Alex', lastName: 'Taylor', postalCode: 'PR2 3AB' };

/** Convert a displayed amount such as "Item total: $39.98" to integer cents (avoids float rounding). */
function toCents(text) {
  const match = text.match(/[$£](\d+)\.(\d{2})/);
  if (!match) throw new Error(`No currency amount found in: "${text}"`);
  return Number(match[1]) * 100 + Number(match[2]);
}

/**
 * DEMO PRESENTATION ONLY: SauceDemo has no currency setting and always shows "$".
 * For the UK audience this rewrites "$<digit>" to "£<digit>" on screen as the page renders.
 * It changes the SYMBOL only - the numbers are NOT converted, so £39.98 here is the
 * app's $39.98. It is not a requirement from UKIQC-1 and does not test any GBP behaviour.
 */
async function showPoundSymbol(page) {
  await page.addInitScript(() => {
    // React renders "$" and "29.99" as separate text nodes, so also handle a trailing "$"
    // followed by a sibling text node that starts with a digit.
    const swap = (root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const next = n.nextSibling;
        if (n.nodeValue.endsWith('$') && next && next.nodeType === Node.TEXT_NODE && /^\d/.test(next.nodeValue)) {
          n.nodeValue = n.nodeValue.slice(0, -1) + '£';
        } else if (/\$\d/.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/\$(?=\d)/g, '£');
        }
      }
    };
    new MutationObserver(() => swap(document.body)).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

async function login(page) {
  await page.goto('/');
  await page.locator('[data-test="username"]').fill(USER.username);
  await page.locator('[data-test="password"]').fill(USER.password);
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/inventory\.html/);
}

async function addItemsToCart(page) {
  for (const item of ITEMS) {
    await page.locator(`[data-test="add-to-cart-${item.slug}"]`).click();
    await expect(page.locator(`[data-test="remove-${item.slug}"]`)).toBeVisible();
  }
}

test.describe('UKIQC-1', () => {
  test.beforeEach(async ({ page }) => {
    await showPoundSymbol(page);
  });

  test('UKIQC-2 TC1 cart badge', async ({ page }) => {
    await login(page);
    await addItemsToCart(page);

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
  });

  test('UKIQC-3 TC2 checkout totals', async ({ page }) => {
    await login(page);
    await addItemsToCart(page);

    // Cart: both items are listed
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(/cart\.html/);
    const cartNames = page.locator('[data-test="inventory-item-name"]');
    await expect(cartNames).toHaveText(ITEMS.map((i) => i.name));

    // Checkout: enter the valid details from the story
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill(CHECKOUT.firstName);
    await page.locator('[data-test="lastName"]').fill(CHECKOUT.lastName);
    await page.locator('[data-test="postalCode"]').fill(CHECKOUT.postalCode);
    await page.locator('[data-test="continue"]').click();

    // Checkout Overview: price breakdown is displayed
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    const subtotalLabel = page.locator('[data-test="subtotal-label"]');
    const taxLabel = page.locator('[data-test="tax-label"]');
    const totalLabel = page.locator('[data-test="total-label"]');
    await expect(subtotalLabel).toBeVisible();
    await expect(taxLabel).toBeVisible();
    await expect(totalLabel).toBeVisible();

    // Relationship checks only - no fixed values (see REQUIREMENT GAP above)
    const itemPrices = await page.locator('[data-test="inventory-item-price"]').allTextContents();
    expect(itemPrices).toHaveLength(ITEMS.length);

    const sumOfItemsCents = itemPrices.map(toCents).reduce((a, b) => a + b, 0);
    const itemTotalCents = toCents(await subtotalLabel.innerText());
    const taxCents = toCents(await taxLabel.innerText());
    const totalCents = toCents(await totalLabel.innerText());

    expect(itemTotalCents, 'Item Total equals the sum of the item prices').toBe(sumOfItemsCents);
    expect(taxCents, 'Tax is a non-negative amount').toBeGreaterThanOrEqual(0);
    expect(totalCents, 'Total equals Item Total plus Tax').toBe(itemTotalCents + taxCents);
  });
});
