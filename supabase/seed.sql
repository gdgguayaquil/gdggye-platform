-- seed.sql
-- Local-dev seed data for the GDG Guayaquil platform.
-- Mirrors apps/web-main/lib/data.ts so the local stack serves the same
-- events and event_content as the prototype.

-- ─────────────── events ───────────────
insert into public.events (
  slug, name, type, year, status, language_mode,
  start_at, end_at, timezone,
  venue_name, venue_address, venue_map_url,
  ticket_url, leaderboard_enabled, theme_key,
  summary_es, summary_en, expected_attendance
) values
(
  'bwai-2026', 'Build with AI', 'build_with_ai', 2026, 'published', 'bilingual',
  '2026-05-23 09:00:00-05', '2026-05-23 19:00:00-05', 'America/Guayaquil',
  'ESPOL — Centro de Convenciones',
  'Km 30.5 Vía Perimetral, Guayaquil',
  null,
  'https://gdggye.org/bwai-2026/tickets',
  true,
  'gdggye-core',
  'Un día construyendo con modelos generativos: Gemini, fine-tuning, agentes y producción.',
  'One day building with generative models: Gemini, fine-tuning, agents, and production.',
  '450+'
),
(
  'devfest-2026', 'DevFest', 'devfest', 2026, 'published', 'bilingual',
  '2026-11-14 08:30:00-05', '2026-11-14 20:00:00-05', 'America/Guayaquil',
  'Universidad Casa Grande — Auditorio',
  'Av. Las Palmas 304, Guayaquil',
  null,
  'https://gdggye.org/devfest-2026/tickets',
  true,
  'gdggye-core',
  'El festival anual de la comunidad. Cuatro tracks, talleres en paralelo y más de 30 sesiones.',
  'The community''s annual festival. Four tracks, parallel workshops, and 30+ sessions.',
  '800+'
),
(
  'io-extended-2026', 'I/O Extended', 'google_io', 2026, 'published', 'bilingual',
  '2026-06-20 14:00:00-05', '2026-06-20 20:00:00-05', 'America/Guayaquil',
  'Innopolis Hub',
  'Cdla. Kennedy Norte, Guayaquil',
  null,
  'https://gdggye.org/io-extended-2026/tickets',
  false,
  'gdggye-core',
  'Repaso comunitario de I/O 2026: lo más relevante para devs, en formato charla + lightning talks.',
  'Community recap of I/O 2026: what matters for devs, in talk + lightning-talk format.',
  '180'
);

-- ─────────────── event_content for bwai-2026 ───────────────
-- Speakers + sponsors live in real tables since 0006/0007; agenda since
-- 0009. event_content only carries hero / gallery / faq now.
insert into public.event_content (event_id, hero, gallery, faq)
select
  e.id,
  jsonb_build_object(
    'tagline_es', 'Construye con modelos. Mide en producción.',
    'tagline_en', 'Build with models. Measure in production.',
    'lede_es', 'Un sábado completo dedicado a llevar IA generativa más allá del demo: arquitectura, costos, evals y entrega real. Con speakers de Ecuador, Colombia y Perú.',
    'lede_en', 'A full Saturday dedicated to taking generative AI past the demo: architecture, cost, evals, and real shipping. Speakers from Ecuador, Colombia, and Peru.'
  ),
  '[]'::jsonb,
  '[
    {"q_es":"¿Hay que saber programar para asistir?","q_en":"Do I need to know how to code to attend?","a_es":"Las charlas plenarias son accesibles para cualquier perfil técnico. Los workshops de la sala Hands-on requieren saber al menos un lenguaje (Python o JS recomendado) y traer laptop.","a_en":"The plenary talks are accessible to any technical profile. The Hands-on room workshops require at least one language (Python or JS recommended) and a laptop."},
    {"q_es":"¿El evento es gratuito?","q_en":"Is the event free?","a_es":"Hay tres categorías: Community (gratis, cupo limitado), Standard (USD 25, incluye almuerzo y kit) y Workshop Pass (USD 60, incluye plaza garantizada en talleres hands-on).","a_en":"Three categories: Community (free, limited spots), Standard (USD 25, includes lunch and kit), and Workshop Pass (USD 60, guaranteed spot in hands-on workshops)."},
    {"q_es":"¿En qué idioma serán las charlas?","q_en":"What language will talks be in?","a_es":"Mayoritariamente en español. Speakers internacionales pueden presentar en inglés. No hay traducción simultánea.","a_en":"Mostly Spanish. International speakers may present in English. There is no simultaneous translation."},
    {"q_es":"¿Hay estacionamiento?","q_en":"Is parking available?","a_es":"ESPOL tiene estacionamiento gratuito de visitantes. Recomendamos llegar antes de las 8:45 para asegurar lugar. Hay parada de la Metrovía a 400m.","a_en":"ESPOL has free visitor parking. We recommend arriving before 8:45 to secure a spot. There is a Metrovía stop 400m away."},
    {"q_es":"¿Puedo presentar un lightning talk?","q_en":"Can I present a lightning talk?","a_es":"Sí. Abrimos 8 cupos comunitarios de 5 minutos cada uno. Postulación en el formulario hasta el 10 de mayo.","a_en":"Yes. We open 8 community slots of 5 minutes each. Apply via the form until May 10."},
    {"q_es":"¿Tendrá grabación?","q_en":"Will sessions be recorded?","a_es":"Las charlas de plenaria se publicarán en el canal de YouTube en las dos semanas siguientes. Los workshops no se graban.","a_en":"Plenary talks will be published on YouTube within two weeks. Workshops are not recorded."}
  ]'::jsonb
from public.events e
where e.slug = 'bwai-2026';

-- ─────────────── speakers (global identity) ───────────────
insert into public.speakers (slug, name, role_es, role_en, city) values
  ('maria-cabrera',   'María Cabrera',   'Staff AI Eng · Mercado Libre', 'Staff AI Eng · Mercado Libre', 'Bogotá'),
  ('diego-salinas',   'Diego Salinas',   'GDE Cloud · Independiente',    'GDE Cloud · Independent',      'Quito'),
  ('lucia-vega',      'Lucía Vega',      'Senior ML Eng · Kushki',       'Senior ML Eng · Kushki',       'Guayaquil'),
  ('andres-pacheco',  'Andrés Pacheco',  'Founding Eng · Truora',        'Founding Eng · Truora',        'Lima'),
  ('camila-ruiz',     'Camila Ruiz',     'Customer Eng · Google Cloud',  'Customer Eng · Google Cloud',  'CDMX'),
  ('joel-mendoza',    'Joel Mendoza',    'CTO · Banco Pichincha Labs',   'CTO · Banco Pichincha Labs',   'Guayaquil'),
  ('valentina-soto',  'Valentina Soto',  'Founder · evals.dev',          'Founder · evals.dev',          'Santiago'),
  ('rafael-castro',   'Rafael Castro',   'AI PM · Despegar',             'AI PM · Despegar',             'BA')
on conflict (slug) do nothing;

-- attach all speakers to bwai-2026 in display order
insert into public.event_speakers (event_id, speaker_id, display_order, is_headliner)
select e.id, s.id, pos.display_order, (s.slug = 'maria-cabrera')
from public.events e
cross join (values
  ('maria-cabrera',  0),
  ('diego-salinas',  1),
  ('lucia-vega',     2),
  ('andres-pacheco', 3),
  ('camila-ruiz',    4),
  ('joel-mendoza',   5),
  ('valentina-soto', 6),
  ('rafael-castro',  7)
) as pos(slug, display_order)
join public.speakers s on s.slug = pos.slug
where e.slug = 'bwai-2026'
on conflict (event_id, speaker_id) do nothing;

-- ─────────────── sponsors (global identity) ───────────────
insert into public.sponsors (slug, name, default_tier) values
  ('banco-pichincha', 'Banco Pichincha', 'platinum'),
  ('kushki',          'Kushki',          'platinum'),
  ('pacifico-cloud',  'Pacifico Cloud',  'gold'),
  ('truora',          'Truora',          'gold'),
  ('despegar',        'Despegar',        'gold'),
  ('evals-dev',       'evals.dev',       'silver'),
  ('innopolis',       'Innopolis',       'silver'),
  ('aeris',           'Aeris',           'silver'),
  ('forma-ai',        'Forma.ai',        'silver'),
  ('espol',           'ESPOL',           'community'),
  ('gdg-quito',       'GDG Quito',       'community'),
  ('gdg-lima',        'GDG Lima',        'community'),
  ('wtm-ecuador',     'WTM Ecuador',     'community'),
  ('laboratoria',     'Laboratoria',     'community'),
  ('platzi',          'Platzi',          'community')
on conflict (slug) do nothing;

-- attach all sponsors to bwai-2026 with the tier they belong to
insert into public.event_sponsors (event_id, sponsor_id, tier, is_active)
select e.id, s.id, s.default_tier, true
from public.events e, public.sponsors s
where e.slug = 'bwai-2026'
on conflict (event_id, sponsor_id) do nothing;

-- ─────────────── agenda for bwai-2026 ───────────────
-- start_at is computed from the event's date + the clock time of day at
-- the event's timezone, so the migrated instants are timezone-safe.
with slot_data (time_of_day, dur, title_es, title_en, track, room, display_order) as (
  values
    ('09:00'::time, 30, 'Registro y desayuno',                                   'Check-in & breakfast',                          null::text,        'Lobby',       0),
    ('09:30'::time, 30, 'Bienvenida + estado del capítulo',                      'Welcome + chapter update',                      'Plenaria',        'Auditorio A', 1),
    ('10:00'::time, 50, 'Keynote: Agentes en producción, lecciones de un año',   'Keynote: Agents in production, a year of lessons','Plenaria',       'Auditorio A', 2),
    ('11:00'::time, 45, 'Workshop: Gemini API + tool use desde cero',            'Workshop: Gemini API + tool use from scratch',  'Hands-on',        'Sala 1',      3),
    ('11:00'::time, 45, 'Talk: Evals que no mienten',                            'Talk: Evals that don''t lie',                   'AI Engineering',  'Auditorio A', 4),
    ('12:00'::time, 60, 'Almuerzo + networking',                                 'Lunch + networking',                            null,              'Patio',       5),
    ('13:00'::time, 45, 'Talk: RAG en español, lo que rompe',                    'Talk: RAG in Spanish, what breaks',             'AI Engineering',  'Auditorio A', 6),
    ('13:00'::time, 45, 'Workshop: Fine-tuning con Vertex AI',                   'Workshop: Fine-tuning with Vertex AI',          'Hands-on',        'Sala 1',      7),
    ('14:00'::time, 45, 'Panel: Costos reales de IA en startups latam',          'Panel: Real AI costs at LatAm startups',        'Plenaria',        'Auditorio A', 8),
    ('15:00'::time, 60, 'Hackathon flash: agentes con propósito',                'Flash hackathon: agents with purpose',          'Hands-on',        'Sala 1+2',    9),
    ('17:00'::time, 30, 'Lightning talks comunitarias',                          'Community lightning talks',                     'Plenaria',        'Auditorio A', 10),
    ('18:00'::time, 60, 'Cierre + after en planta baja',                         'Closing + after-party downstairs',              null,              'Patio',       11)
)
insert into public.agenda_slots
  (event_id, start_at, duration_minutes, title_es, title_en, track, room, display_order)
select
  e.id,
  ((e.start_at at time zone e.timezone)::date + s.time_of_day) at time zone e.timezone,
  s.dur, s.title_es, s.title_en, s.track, s.room, s.display_order
from public.events e
cross join slot_data s
where e.slug = 'bwai-2026';

-- Speaker assignments per slot (by display_order ↔ speaker slug).
-- The panel demonstrates a multi-speaker slot (Joel + Valentina + Rafael).
with assignments (slot_order, speaker_slug, speaker_order) as (
  values
    (2,  'maria-cabrera',  0),
    (3,  'diego-salinas',  0),
    (4,  'lucia-vega',     0),
    (6,  'andres-pacheco', 0),
    (7,  'camila-ruiz',    0),
    (8,  'joel-mendoza',   0),
    (8,  'valentina-soto', 1),
    (8,  'rafael-castro',  2)
)
insert into public.agenda_slot_speakers (slot_id, speaker_id, display_order)
select s.id, sp.id, a.speaker_order
from public.agenda_slots s
join public.events       e  on e.id = s.event_id and e.slug = 'bwai-2026'
join assignments         a  on a.slot_order = s.display_order
join public.speakers     sp on sp.slug = a.speaker_slug
on conflict (slot_id, speaker_id) do nothing;

-- ─────────────── pre-checkin deadlines ───────────────
-- Set a far-future deadline so the pre-checkin flow is testable in dev.
-- Organizers tighten these via the admin UI for real events.
update public.events set pre_checkin_deadline = '2027-12-31 23:59:00-05'
where slug in ('bwai-2026', 'devfest-2026');
