ALTER TABLE public.items ADD COLUMN placement text NOT NULL DEFAULT 'shelf', ADD COLUMN sort_order double precision NOT NULL DEFAULT 0;
ALTER TABLE public.items ADD CONSTRAINT items_placement_valid CHECK (placement IN ('shelf', 'pile'));
ALTER TABLE public.items ALTER COLUMN status SET DEFAULT 'to_read';
ALTER TABLE public.profiles ADD COLUMN cat_name text NOT NULL DEFAULT 'Mochi', ADD COLUMN genres text[] NOT NULL DEFAULT ARRAY['Mythology','Philosophy','Current affairs','Romance','Sci-fi','Health','Non-fiction','Fantasy','Fiction'];
UPDATE public.profiles p SET genres = ARRAY(SELECT DISTINCT g FROM unnest(p.genres || ARRAY(SELECT genre FROM public.items WHERE user_id = p.id)) AS g ORDER BY g);
WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY user_id, genre ORDER BY created_at, id) AS position FROM public.items) UPDATE public.items i SET sort_order = ranked.position FROM ranked WHERE ranked.id = i.id;