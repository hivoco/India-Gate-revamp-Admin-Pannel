-- FAQ hub categories are now whatever the rows carry, and the site renders
-- that value as the tab label. The seeded rows held lowercase slugs, which
-- would show as "general" / "cooking" on the tabs, so they get promoted to
-- their display form.
--
-- After this, adding a category is just typing a new one on a FAQ.
--
-- Safe to re-run.

UPDATE faqs SET category = 'General'    WHERE page_key = 'faqs-hub' AND category = 'general';
UPDATE faqs SET category = 'Cooking'    WHERE page_key = 'faqs-hub' AND category = 'cooking';
UPDATE faqs SET category = 'Varieties'  WHERE page_key = 'faqs-hub' AND category = 'varieties';
UPDATE faqs SET category = 'Storage'    WHERE page_key = 'faqs-hub' AND category = 'storage';
UPDATE faqs SET category = 'Nutrition'  WHERE page_key = 'faqs-hub' AND category = 'nutrition';
