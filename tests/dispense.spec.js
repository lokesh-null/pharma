import { test, expect } from '@playwright/test';

test.describe('Prescription Flow and Dispensation', () => {
  // Use a longer timeout for E2E flow
  test.setTimeout(60000);

  test('should allow a pharmacist to login and dispense a prescription', async ({ page }) => {
    // 1. Login as Pharmacist
    await page.goto('http://localhost:5173/login');
    
    // Select Pharmacist role
    await page.click('button:has-text("Pharmacist")');

    // Fill login form
    await page.fill('input[type="email"]', 'pharmacy@pharmalync.in');
    // Using demo password from seed
    await page.fill('input[type="password"]', 'pharmacy123');
    await page.click('button:has-text("Sign In")');

    // Should redirect to pharmacist dashboard (scan page)
    await expect(page).toHaveURL(/.*\/pharmacist\/scan/);

    // 2. Navigate to Dispense Page manually (simulating scanning a QR)
    await page.goto('http://localhost:5173/pharmacist/dispense');
    
    // Wait for the UI to load by looking for the Prescriptions section
    await expect(page.locator('h3:has-text("Prescriptions")')).toBeVisible({ timeout: 10000 });

    // 3. Mark medicine as dispensed
    // Click on the first prescription to open the modal
    await page.locator('text=#RX-98765').click();
    
    // Click Add on the first medicine
    await page.locator('button:has-text("Add")').first().click();
    
    // Close modal by clicking the X button in the modal header
    await page.locator('.bg-teal-600 button').click();
    
    // Click Confirm Dispense
    await page.locator('button:has-text("Confirm Dispense")').click();
    
    // Wait for the success state
    await expect(page.locator('text=Dispense Complete')).toBeVisible();

    // 4. Click Next Patient to finish
    await page.click('button:has-text("Next Patient")');
  });
});
