-- Fix existing unlinked client: Link test123@advisable.com to nutritionax@gmail.com
-- This will make the client visible to the nutritionist

INSERT INTO client_nutritionists (client_id, nutritionist_id)
VALUES (
  '6297edbd-59f5-43f4-ae80-3b161df74377',  -- test123@advisable.com (client user_id)
  '46c6a8c9-e7da-496f-bfcc-975967803a67'   -- nutritionax@gmail.com nutritionist_id
)
ON CONFLICT DO NOTHING;  -- Prevent duplicate if already exists