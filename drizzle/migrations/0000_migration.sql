CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  library_name text NOT NULL DEFAULT 'Bookscape',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  author text,
  kind text NOT NULL DEFAULT 'book',
  genre text NOT NULL DEFAULT 'Fiction',
  url text,
  description text,
  color text NOT NULL DEFAULT 'coral',
  reading_minutes int NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'to_read',
  open_count int NOT NULL DEFAULT 0,
  last_opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items" ON public.items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX items_user_idx ON public.items(user_id);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := NEW.id;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (u, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)));

  INSERT INTO public.items (user_id,title,author,kind,genre,url,description,color,reading_minutes,status,open_count,created_at) VALUES
  (u,'The Forest of Enchantments','Chitra Banerjee Divakaruni','book','Mythology','https://www.harpercollins.co.in/product/the-forest-of-enchantments/','The Ramayana retold through Sita''s eyes.','rose',540,'read',7, now() - interval '90 days'),
  (u,'Rich Dad Poor Dad','Robert T. Kiyosaki','book','Non-fiction','https://www.richdad.com/','What the rich teach their kids about money.','amber',360,'read',4, now() - interval '60 days'),
  (u,'Atomic Habits','James Clear','book','Health','https://jamesclear.com/atomic-habits','Tiny changes, remarkable results.','gold',330,'reading',3, now() - interval '30 days'),
  (u,'The Road to Character','David Brooks','book','Philosophy','https://www.penguinrandomhouse.com/books/220736/the-road-to-character-by-david-brooks/','Résumé virtues vs. eulogy virtues.','teal',600,'to_read',0, now() - interval '21 days'),
  (u,'The Second Mountain','David Brooks','book','Philosophy','https://www.penguinrandomhouse.com/books/533034/the-second-mountain-by-david-brooks/','The quest for a moral life.','sage',570,'to_read',0, now() - interval '18 days'),
  (u,'Satvic Revolution','Subah Saraf & Harshvardhan Saraf','book','Health','https://satvicmovement.org/','A guide to natural living and food.','lime',300,'to_read',0, now() - interval '25 days'),
  (u,'The Palace of Illusions','Chitra Banerjee Divakaruni','book','Mythology','https://www.penguinrandomhouse.com/books/157010/the-palace-of-illusions-by-chitra-banerjee-divakaruni/','The Mahabharata through Draupadi.','plum',480,'read',2, now() - interval '120 days'),
  (u,'Sapiens','Yuval Noah Harari','book','Non-fiction','https://www.ynharari.com/book/sapiens-2/','A brief history of humankind.','coral',720,'reading',1, now() - interval '40 days'),
  (u,'Dune','Frank Herbert','book','Sci-fi','https://www.penguinrandomhouse.com/books/352905/dune-by-frank-herbert/','Spice, sand and destiny.','amber',1200,'to_read',0, now() - interval '50 days'),
  (u,'Project Hail Mary','Andy Weir','book','Sci-fi','https://www.andyweirauthor.com/','A lone astronaut saves the world.','sky',660,'read',1, now() - interval '75 days'),
  (u,'Pride and Prejudice','Jane Austen','book','Romance','https://www.gutenberg.org/ebooks/1342','The original slow burn.','rose',600,'read',5, now() - interval '200 days'),
  (u,'The Night Circus','Erin Morgenstern','book','Fantasy','https://erinmorgenstern.com/','A magical competition in black and white.','indigo',690,'to_read',0, now() - interval '10 days'),
  (u,'The Alchemist','Paulo Coelho','book','Fiction','https://paulocoelhoblog.com/','Follow your personal legend.','gold',240,'read',6, now() - interval '300 days'),
  (u,'Meditations','Marcus Aurelius','book','Philosophy','https://www.gutenberg.org/ebooks/2680','Notes to himself, still useful.','stone',270,'reading',2, now() - interval '35 days'),
  (u,'You Had Me at Hello','Newsletter','newsletter','Current affairs','https://www.youhadmeathello.co/','A warm weekly letter worth opening.','coral',8,'to_read',0, now() - interval '22 days'),
  (u,'Nature: research news','Nature','article','Current affairs','https://www.nature.com/articles/d41586-025-04096-z','A Nature news feature on recent research.','teal',12,'to_read',0, now() - interval '20 days'),
  (u,'ROSE research outsmarts endometriosis','Feinstein Institutes, Northwell','research','Health','https://feinstein.northwell.edu/institutes-researchers/institute-molecular-medicine/robert-s-boas-center-for-genomics-and-human-genetics/rose-research-outsmarts-endometriosis','How the ROSE study is changing endometriosis diagnosis.','plum',10,'reading',1, now() - interval '14 days');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();