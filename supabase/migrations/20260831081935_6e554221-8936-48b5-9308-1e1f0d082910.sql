
CREATE TABLE public.counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code integer NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id uuid NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (county_id, name)
);
CREATE TABLE public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (constituency_id, name)
);
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ward_id, name)
);
CREATE TABLE public.sub_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, name)
);
CREATE TABLE public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_location_id uuid NOT NULL REFERENCES public.sub_locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sub_location_id, name)
);
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL,
  town text,
  county_id uuid REFERENCES public.counties(id) ON DELETE SET NULL,
  constituency_id uuid REFERENCES public.constituencies(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES public.wards(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.data_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  suggested_name text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_constituencies_county ON public.constituencies(county_id);
CREATE INDEX idx_wards_constituency ON public.wards(constituency_id);
CREATE INDEX idx_locations_ward ON public.locations(ward_id);
CREATE INDEX idx_sub_locations_location ON public.sub_locations(location_id);
CREATE INDEX idx_villages_sub_location ON public.villages(sub_location_id);
CREATE INDEX idx_institutions_name ON public.institutions(lower(name));

GRANT SELECT ON public.counties, public.constituencies, public.wards, public.locations, public.sub_locations, public.villages, public.institutions TO anon, authenticated;
GRANT INSERT ON public.data_reports TO anon, authenticated;
GRANT ALL ON public.counties, public.constituencies, public.wards, public.locations, public.sub_locations, public.villages, public.institutions, public.data_reports TO service_role;

ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reference data is readable" ON public.counties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.constituencies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.wards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.locations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.sub_locations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.villages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reference data is readable" ON public.institutions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can report a data problem" ON public.data_reports FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.counties (code, name) VALUES
(1,'Mombasa'),(2,'Kwale'),(3,'Kilifi'),(4,'Tana River'),(5,'Lamu'),(6,'Taita Taveta'),
(7,'Garissa'),(8,'Wajir'),(9,'Mandera'),(10,'Marsabit'),(11,'Isiolo'),(12,'Meru'),
(13,'Tharaka-Nithi'),(14,'Embu'),(15,'Kitui'),(16,'Machakos'),(17,'Makueni'),(18,'Nyandarua'),
(19,'Nyeri'),(20,'Kirinyaga'),(21,'Murang''a'),(22,'Kiambu'),(23,'Turkana'),(24,'West Pokot'),
(25,'Samburu'),(26,'Trans Nzoia'),(27,'Uasin Gishu'),(28,'Elgeyo-Marakwet'),(29,'Nandi'),
(30,'Baringo'),(31,'Laikipia'),(32,'Nakuru'),(33,'Narok'),(34,'Kajiado'),(35,'Kericho'),
(36,'Bomet'),(37,'Kakamega'),(38,'Vihiga'),(39,'Bungoma'),(40,'Busia'),(41,'Siaya'),
(42,'Kisumu'),(43,'Homa Bay'),(44,'Migori'),(45,'Kisii'),(46,'Nyamira'),(47,'Nairobi City');

INSERT INTO public.constituencies (county_id, name)
SELECT c.id, v.name FROM (VALUES
('Nairobi City','Westlands'),('Nairobi City','Dagoretti North'),('Nairobi City','Dagoretti South'),
('Nairobi City','Langata'),('Nairobi City','Kibra'),('Nairobi City','Roysambu'),
('Nairobi City','Kasarani'),('Nairobi City','Ruaraka'),('Nairobi City','Embakasi South'),
('Nairobi City','Embakasi North'),('Nairobi City','Embakasi Central'),('Nairobi City','Embakasi East'),
('Nairobi City','Embakasi West'),('Nairobi City','Makadara'),('Nairobi City','Kamukunji'),
('Nairobi City','Starehe'),('Nairobi City','Mathare'),
('Kiambu','Gatundu South'),('Kiambu','Gatundu North'),('Kiambu','Juja'),('Kiambu','Thika Town'),
('Kiambu','Ruiru'),('Kiambu','Githunguri'),('Kiambu','Kiambu'),('Kiambu','Kiambaa'),
('Kiambu','Kabete'),('Kiambu','Kikuyu'),('Kiambu','Limuru'),('Kiambu','Lari'),
('Mombasa','Changamwe'),('Mombasa','Jomvu'),('Mombasa','Kisauni'),('Mombasa','Nyali'),
('Mombasa','Likoni'),('Mombasa','Mvita'),
('Kisumu','Kisumu East'),('Kisumu','Kisumu West'),('Kisumu','Kisumu Central'),('Kisumu','Seme'),
('Kisumu','Nyando'),('Kisumu','Muhoroni'),('Kisumu','Nyakach'),
('Nakuru','Nakuru Town East'),('Nakuru','Nakuru Town West'),('Nakuru','Naivasha'),('Nakuru','Gilgil'),
('Nakuru','Molo'),('Nakuru','Njoro'),('Nakuru','Rongai'),('Nakuru','Subukia'),('Nakuru','Bahati'),
('Nakuru','Kuresoi North'),('Nakuru','Kuresoi South'),
('Machakos','Machakos Town'),('Machakos','Mavoko'),('Machakos','Kathiani'),('Machakos','Matungulu'),
('Machakos','Kangundo'),('Machakos','Yatta'),('Machakos','Masinga'),('Machakos','Mwala'),
('Uasin Gishu','Ainabkoi'),('Uasin Gishu','Kapseret'),('Uasin Gishu','Kesses'),('Uasin Gishu','Moiben'),
('Uasin Gishu','Soy'),('Uasin Gishu','Turbo'),
('Kakamega','Lugari'),('Kakamega','Likuyani'),('Kakamega','Malava'),('Kakamega','Lurambi'),
('Kakamega','Navakholo'),('Kakamega','Mumias West'),('Kakamega','Mumias East'),('Kakamega','Matungu'),
('Kakamega','Butere'),('Kakamega','Khwisero'),('Kakamega','Shinyalu'),('Kakamega','Ikolomani'),
('Nyeri','Tetu'),('Nyeri','Kieni'),('Nyeri','Mathira'),('Nyeri','Othaya'),('Nyeri','Mukurweini'),
('Nyeri','Nyeri Town'),
('Meru','Igembe South'),('Meru','Igembe Central'),('Meru','Igembe North'),('Meru','Tigania West'),
('Meru','Tigania East'),('Meru','North Imenti'),('Meru','Buuri'),('Meru','Central Imenti'),
('Meru','South Imenti')
) AS v(county, name) JOIN public.counties c ON c.name = v.county;

INSERT INTO public.wards (constituency_id, name)
SELECT k.id, v.name FROM (VALUES
('Westlands','Kitisuru'),('Westlands','Parklands/Highridge'),('Westlands','Karura'),('Westlands','Kangemi'),('Westlands','Mountain View'),
('Dagoretti North','Kilimani'),('Dagoretti North','Kawangware'),('Dagoretti North','Gatina'),('Dagoretti North','Kileleshwa'),('Dagoretti North','Kabiro'),
('Dagoretti South','Mutu-ini'),('Dagoretti South','Ngando'),('Dagoretti South','Riruta'),('Dagoretti South','Uthiru/Ruthimitu'),('Dagoretti South','Waithaka'),
('Langata','Karen'),('Langata','Nairobi West'),('Langata','Mugumo-ini'),('Langata','South C'),('Langata','Nyayo Highrise'),
('Kibra','Laini Saba'),('Kibra','Lindi'),('Kibra','Makina'),('Kibra','Woodley/Kenyatta Golf Course'),('Kibra','Sarangombe'),
('Kasarani','Clay City'),('Kasarani','Mwiki'),('Kasarani','Kasarani'),('Kasarani','Njiru'),('Kasarani','Ruai'),
('Roysambu','Githurai'),('Roysambu','Kahawa West'),('Roysambu','Zimmerman'),('Roysambu','Roysambu'),('Roysambu','Kahawa'),
('Embakasi East','Upper Savannah'),('Embakasi East','Lower Savannah'),('Embakasi East','Embakasi'),('Embakasi East','Utawala'),('Embakasi East','Mihango'),
('Starehe','Nairobi Central'),('Starehe','Ngara'),('Starehe','Pangani'),('Starehe','Ziwani/Kariokor'),('Starehe','Landimawe'),('Starehe','Nairobi South'),
('Ruiru','Gitothua'),('Ruiru','Biashara'),('Ruiru','Gatongora'),('Ruiru','Kahawa Sukari'),('Ruiru','Kahawa Wendani'),('Ruiru','Kiuu'),('Ruiru','Mwiki'),('Ruiru','Mwihoko'),
('Thika Town','Township'),('Thika Town','Kamenu'),('Thika Town','Hospital'),('Thika Town','Gatuanyaga'),('Thika Town','Ngoliba'),
('Kikuyu','Karai'),('Kikuyu','Nachu'),('Kikuyu','Sigona'),('Kikuyu','Kikuyu'),('Kikuyu','Kinoo'),
('Kiambu','Ting''ang''a'),('Kiambu','Ndumberi'),('Kiambu','Riabai'),('Kiambu','Township'),
('Kabete','Gitaru'),('Kabete','Muguga'),('Kabete','Nyathuna'),('Kabete','Kabete'),('Kabete','Uthiru'),
('Juja','Murera'),('Juja','Theta'),('Juja','Juja'),('Juja','Witeithie'),('Juja','Kalimoni'),
('Nyali','Frere Town'),('Nyali','Ziwa la Ng''ombe'),('Nyali','Mkomani'),('Nyali','Kongowea'),('Nyali','Kadzandani'),
('Mvita','Mji wa Kale/Makadara'),('Mvita','Tudor'),('Mvita','Tononoka'),('Mvita','Shimanzi/Ganjoni'),('Mvita','Majengo'),
('Kisauni','Mjambere'),('Kisauni','Junda'),('Kisauni','Bamburi'),('Kisauni','Mwakirunge'),('Kisauni','Mtopanga'),('Kisauni','Magogoni'),('Kisauni','Shanzu'),
('Kisumu Central','Railways'),('Kisumu Central','Migosi'),('Kisumu Central','Shaurimoyo Kaloleni'),('Kisumu Central','Market Milimani'),('Kisumu Central','Kondele'),('Kisumu Central','Nyalenda B'),
('Kisumu East','Kajulu'),('Kisumu East','Kolwa East'),('Kisumu East','Manyatta B'),('Kisumu East','Nyalenda A'),('Kisumu East','Kolwa Central'),
('Nakuru Town East','Biashara'),('Nakuru Town East','Kivumbini'),('Nakuru Town East','Flamingo'),('Nakuru Town East','Menengai'),('Nakuru Town East','Nakuru East'),
('Naivasha','Biashara'),('Naivasha','Hells Gate'),('Naivasha','Lake View'),('Naivasha','Maiella'),('Naivasha','Mai Mahiu'),('Naivasha','Olkaria'),('Naivasha','Naivasha East'),('Naivasha','Viwandani'),
('Machakos Town','Kalama'),('Machakos Town','Mua'),('Machakos Town','Mumbuni North'),('Machakos Town','Muvuti/Kiima-Kimwe'),('Machakos Town','Kola'),('Machakos Town','Machakos Central'),
('Mavoko','Athi River'),('Mavoko','Kinanie'),('Mavoko','Muthwani'),('Mavoko','Syokimau/Mulolongo'),
('Kapseret','Simat/Kapseret'),('Kapseret','Kipkenyo'),('Kapseret','Ngeria'),('Kapseret','Megun'),('Kapseret','Langas'),
('Ainabkoi','Kapsoya'),('Ainabkoi','Kaptagat'),('Ainabkoi','Ainabkoi/Olare'),
('Lurambi','Butsotso East'),('Lurambi','Butsotso South'),('Lurambi','Butsotso Central'),('Lurambi','Sheywe'),('Lurambi','Mahiakalo'),('Lurambi','Shirere'),
('Nyeri Town','Kiganjo/Mathari'),('Nyeri Town','Rware'),('Nyeri Town','Gatitu/Muruguru'),('Nyeri Town','Ruring''u'),('Nyeri Town','Kamakwa/Mukaro'),
('Central Imenti','Mwanganthia'),('Central Imenti','Abothuguchi Central'),('Central Imenti','Abothuguchi West'),('Central Imenti','Kiagu')
) AS v(constituency, name) JOIN public.constituencies k ON k.name = v.constituency;

INSERT INTO public.locations (ward_id, name)
SELECT w.id, v.name FROM (VALUES
('Kikuyu','Kikuyu','Kikuyu'),('Kikuyu','Kikuyu','Kidfarmaco'),
('Kikuyu','Kinoo','Kinoo'),('Kikuyu','Kinoo','Gikambura'),
('Kasarani','Kasarani','Kasarani'),('Kasarani','Mwiki','Mwiki'),('Kasarani','Ruai','Ruai'),
('Westlands','Kangemi','Kangemi'),('Westlands','Kitisuru','Kitisuru'),
('Ruiru','Biashara','Ruiru Town'),('Ruiru','Kahawa Sukari','Kahawa Sukari'),
('Thika Town','Township','Thika Township'),('Thika Town','Kamenu','Kamenu'),
('Machakos Town','Machakos Central','Machakos Central'),('Machakos Town','Kalama','Kalama'),
('Nyeri Town','Rware','Nyeri Township'),('Nyeri Town','Kamakwa/Mukaro','Mukaro'),
('Lurambi','Sheywe','Shirere'),('Lurambi','Butsotso East','Butsotso'),
('Kisumu Central','Kondele','Kondele'),('Kisumu Central','Railways','Kisumu Township'),
('Nakuru Town East','Biashara','Nakuru Township'),('Nakuru Town East','Menengai','Menengai'),
('Mvita','Tudor','Tudor'),('Mvita','Majengo','Majengo'),
('Central Imenti','Mwanganthia','Mwanganthia')
) AS v(constituency, ward, name)
JOIN public.constituencies k ON k.name = v.constituency
JOIN public.wards w ON w.constituency_id = k.id AND w.name = v.ward;

INSERT INTO public.sub_locations (location_id, name)
SELECT l.id, v.name FROM (VALUES
('Kikuyu','Kikuyu'),('Kikuyu','Thogoto'),('Kidfarmaco','Kidfarmaco'),('Kidfarmaco','Ondiri'),
('Kinoo','Kinoo'),('Kinoo','Muthiga'),('Gikambura','Gikambura'),
('Kasarani','Kasarani'),('Kasarani','Hunters'),('Mwiki','Mwiki'),('Ruai','Ruai'),('Ruai','Kamulu'),
('Kangemi','Kangemi'),('Kangemi','Sodom'),('Kitisuru','Kitisuru'),('Kitisuru','Lower Kabete'),
('Ruiru Town','Ruiru'),('Ruiru Town','Kimbo'),('Kahawa Sukari','Kahawa Sukari'),
('Thika Township','Thika'),('Thika Township','Makongeni'),('Kamenu','Kiganjo'),
('Machakos Central','Machakos'),('Machakos Central','Mjini'),('Kalama','Kalama'),
('Nyeri Township','Nyeri'),('Nyeri Township','Majengo'),('Mukaro','Mukaro'),
('Shirere','Shirere'),('Butsotso','Butsotso'),
('Kondele','Kondele'),('Kisumu Township','Kaloleni'),('Kisumu Township','Milimani'),
('Nakuru Township','Nakuru'),('Menengai','Menengai'),
('Tudor','Tudor'),('Majengo','Majengo'),
('Mwanganthia','Mwanganthia')
) AS v(location, name)
JOIN public.locations l ON l.name = v.location;

INSERT INTO public.villages (sub_location_id, name)
SELECT s.id, v.name FROM (VALUES
('Thogoto','Thogoto'),('Thogoto','Karinde'),('Ondiri','Ondiri'),('Ondiri','Kidfarmaco Estate'),
('Muthiga','Muthiga'),('Kinoo','Kinoo 87'),('Kasarani','Seasons'),('Hunters','Hunters Estate'),
('Mwiki','Sunton'),('Kamulu','Kamulu'),('Kangemi','Gichagi'),('Sodom','Sodom'),
('Kimbo','Kimbo'),('Kahawa Sukari','Sukari Phase 1'),('Makongeni','Makongeni Estate'),
('Mjini','Mjini'),('Majengo','Majengo'),('Kaloleni','Kaloleni Estate'),('Nakuru','Section 58')
) AS v(sub_location, name)
JOIN public.sub_locations s ON s.name = v.sub_location;

INSERT INTO public.institutions (name, level, town, county_id, constituency_id, ward_id)
SELECT v.name, v.level, v.town, k.county_id, k.id, w.id FROM (VALUES
('Alliance High School','Secondary','Kikuyu','Kikuyu','Kikuyu'),
('Alliance Girls High School','Secondary','Kikuyu','Kikuyu','Kikuyu'),
('Kikuyu Township Primary School','Primary','Kikuyu','Kikuyu','Kikuyu'),
('Presbyterian University of East Africa','University','Kikuyu','Kikuyu','Kikuyu'),
('Starehe Boys Centre','Secondary','Nairobi','Starehe','Nairobi Central'),
('Starehe Girls Centre','Secondary','Nairobi','Roysambu','Kahawa'),
('Nairobi School','Secondary','Nairobi','Westlands','Kitisuru'),
('Kenya High School','Secondary','Nairobi','Dagoretti North','Kileleshwa'),
('Lenana School','Secondary','Nairobi','Langata','Karen'),
('University of Nairobi','University','Nairobi','Starehe','Nairobi Central'),
('Kenyatta University','University','Nairobi','Roysambu','Kahawa'),
('Jomo Kenyatta University of Agriculture and Technology','University','Juja','Juja','Juja'),
('Technical University of Kenya','University','Nairobi','Starehe','Nairobi Central'),
('Strathmore University','University','Nairobi','Langata','Nairobi West'),
('Thika High School','Secondary','Thika','Thika Town','Township'),
('Mama Ngina Girls High School','Secondary','Thika','Thika Town','Hospital'),
('Moi Girls High School Nairobi','Secondary','Nairobi','Langata','Nairobi West'),
('Moi Girls High School Eldoret','Secondary','Eldoret','Kapseret','Langas'),
('Moi Girls High School Nangili','Secondary','Kakamega','Lurambi','Sheywe'),
('Moi University','University','Eldoret','Kesses','Simat/Kapseret'),
('University of Eldoret','University','Eldoret','Soy','Ngeria'),
('Machakos School','Secondary','Machakos','Machakos Town','Machakos Central'),
('Machakos University','University','Machakos','Machakos Town','Machakos Central'),
('Machakos Girls High School','Secondary','Machakos','Machakos Town','Mumbuni North'),
('Nyeri High School','Secondary','Nyeri','Nyeri Town','Rware'),
('Dedan Kimathi University of Technology','University','Nyeri','Mathira','Rware'),
('Kagumo High School','Secondary','Nyeri','Nyeri Town','Kiganjo/Mathari'),
('Kakamega High School','Secondary','Kakamega','Lurambi','Sheywe'),
('Masinde Muliro University of Science and Technology','University','Kakamega','Lurambi','Shirere'),
('Maseno School','Secondary','Kisumu','Kisumu West','Railways'),
('Kisumu Boys High School','Secondary','Kisumu','Kisumu Central','Migosi'),
('Kisumu Girls High School','Secondary','Kisumu','Kisumu Central','Market Milimani'),
('Maseno University','University','Kisumu','Kisumu West','Railways'),
('Nakuru High School','Secondary','Nakuru','Nakuru Town East','Menengai'),
('Nakuru Girls High School','Secondary','Nakuru','Nakuru Town East','Biashara'),
('Egerton University','University','Njoro','Njoro','Menengai'),
('Mombasa Baptist High School','Secondary','Mombasa','Mvita','Tudor'),
('Technical University of Mombasa','University','Mombasa','Mvita','Tudor'),
('Allidina Visram High School','Secondary','Mombasa','Mvita','Tononoka'),
('Meru School','Secondary','Meru','Central Imenti','Mwanganthia'),
('Kenya Methodist University','University','Meru','Central Imenti','Kiagu'),
('Ruiru Technical Training Institute','College','Ruiru','Ruiru','Biashara'),
('Kiambu Institute of Science and Technology','College','Kiambu','Kiambu','Township'),
('Rift Valley Technical Training Institute','College','Eldoret','Ainabkoi','Kapsoya')
) AS v(name, level, town, constituency, ward)
JOIN public.constituencies k ON k.name = v.constituency
LEFT JOIN public.wards w ON w.constituency_id = k.id AND w.name = v.ward;
