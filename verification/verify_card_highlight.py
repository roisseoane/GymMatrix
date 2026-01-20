from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:4173/GymMatrix/")

        # Wait for the first card to appear
        # We modified ExerciseMatrix to force index=0 to be isSuggested=True
        # So the first card should have the cyan background styles

        # Selector for the first ZonalSwipeCard or its internal ExerciseCard
        # We look for the first ExerciseCard div (the one with 'group relative ...')
        # However, getting precise CSS class in Playwright is sometimes tricky if classes are dynamic.
        # We'll just take a screenshot of the grid to verify visually.

        try:
             # Wait for something that indicates content loaded
            page.wait_for_selector(".grid", timeout=10000)

            # Wait a bit for animations
            page.wait_for_timeout(2000)

            # Take screenshot
            page.screenshot(path="verification/card_highlight.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    run()
