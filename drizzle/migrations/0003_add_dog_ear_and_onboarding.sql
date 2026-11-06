ALTER TABLE public.items ADD COLUMN IF NOT EXISTS dog_ear_removed boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;