-- Seeds the home page settings with what the site currently shows, so the
-- panel opens with the live values rather than empty fields and an editor can
-- see what they are changing.
--
-- These were hardcoded in app/page.tsx and MadeWithIndiaGate.tsx. Those values
-- stay in the code as the fallback, this just puts the same thing in the
-- database so it is editable.
--
-- Safe to re-run.

INSERT INTO site_settings (setting_key, value) VALUES
  ('home_journey_heading', 'Our Journey'),
  ('home_journey_video', 'https://d2zibpmra2kiio.cloudfront.net/public/rice-journey.mp4'),
  ('home_cta_label', 'Explore Now'),
  ('home_cta_href', '/recipes'),
  ('home_instagram_featured', 'https://www.instagram.com/indiagatefoods/reel/DYERSO3M15D/'),
  ('home_instagram_posts', 'https://www.instagram.com/indiagatefoods/p/DYpJkj7lBvF/?img_index=5\nhttps://www.instagram.com/indiagatefoods/p/DZui6MslMjO/\nhttps://www.instagram.com/indiagatefoods/p/DZPN2p3lL4i/'),
  ('social_facebook', 'https://www.facebook.com/indiagatefoods'),
  ('social_instagram', 'https://www.instagram.com/indiagatefoods/?hl=en'),
  ('social_youtube', 'https://www.youtube.com/c/IndiaGateFoods'),
  ('social_linkedin', 'https://in.linkedin.com/company/krbl-india-limited'),
  ('social_x', 'https://x.com/IndiaGateFoods')
ON DUPLICATE KEY UPDATE value = VALUES(value);
