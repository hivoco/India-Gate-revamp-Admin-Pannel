-- The hero carousel on the home page.
--
-- Each slide carries two images because the design swaps a portrait phone cut
-- for a landscape desktop one at sm. Both are stored as urls, so they can point
-- at cloudfront in production or at /hero in development.
--
-- link is optional, a slide with one becomes clickable.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS home_slides (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  image_mobile  VARCHAR(512) NOT NULL,
  image_desktop VARCHAR(512) NOT NULL,
  alt           VARCHAR(255) NULL,
  link          VARCHAR(512) NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_home_slides_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- the two slides the site ships with, so the panel opens showing what is live
INSERT INTO home_slides (image_mobile, image_desktop, alt, sort_order) VALUES
  ('https://d2zibpmra2kiio.cloudfront.net/public/hero/hero-mobile-1.png',
   'https://d2zibpmra2kiio.cloudfront.net/public/hero/hero-desktop-1.png',
   'India Gate basmati hero one', 1),
  ('https://d2zibpmra2kiio.cloudfront.net/public/hero/hero-mobile-2.png',
   'https://d2zibpmra2kiio.cloudfront.net/public/hero/hero-desktop-2.png',
   'India Gate basmati hero two', 2);
