-- Seeds the recipes table with the videos hardcoded on /recipes today, so the
-- admin panel starts out matching what is live. Run after 004_recipes.sql.
--
-- Generated from india-gate-2026-ui/app/recipes/data/videos.ts, 9 rows.
-- Safe to run once on an empty table, it does not deduplicate.

INSERT INTO recipes (title, youtube_url, duration, category, difficulty, serves, cook_time, sort_order, is_active) VALUES
  ('Classic Recipe | Navratan Handi with India Gate Classic Rice', 'https://www.youtube.com/watch?v=X4vMxrjY-RM', '2:44', 'Classic', 'Easy', 'Serves 4', '03:00 min', 0, 1),
  ('Biryani Recipe | Special Biryani with India Gate Rice', 'https://www.youtube.com/watch?v=3W7eeA6yZo4', '5:20', 'Biryani', 'Medium', 'Serves 6', '15:00 min', 1, 1),
  ('Pulao Recipe | Delicious Pulao with India Gate Rice', 'https://www.youtube.com/watch?v=kRFjVUgph58', '4:15', 'Pulao', 'Easy', 'Serves 4', '10:00 min', 2, 1),
  ('Kolkata Ramzan Chicken Biryani | Ramadan Special Chicken Biryani', 'https://www.youtube.com/watch?v=oZk4zW1fQww', '10:00', 'Classic', 'Easy', 'Serves 4', '10:00', 3, 1),
  ('Keema Egg Ghotala Biryani Recipe', 'https://www.youtube.com/watch?v=IfYC6QE8NAc', '1:57', 'Classic', 'Easy', 'Serves 4', '2:00', 4, 1),
  ('India Gate Basmati Rice | Veg Zafrani Pulao', 'https://www.youtube.com/watch?v=bq2Gt3xGivk&t=1s', '3:15', 'Classic', 'Easy', 'Serves 4', '3:00', 5, 1),
  ('India Gate Basmati Rice | Vangi Bath', 'https://www.youtube.com/watch?v=YVeAGYdrNcE', '4:15', 'Classic', 'Easy', 'Serves 4', '4:00', 6, 1),
  ('Quinoa Arancini Recipe', 'https://www.youtube.com/watch?v=e_SeK4ByMGU', '4:16', 'Classic', 'Easy', 'Serves 4', '4:00', 7, 1),
  ('Quinoa Spinach Dosa Recipe', 'https://www.youtube.com/watch?v=IaxWE5-7aEo&t=19s', '3:06', 'Classic', 'Easy', 'Serves 4', '3:00', 8, 1);
