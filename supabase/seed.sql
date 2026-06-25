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
-- Speakers + sponsors live in real tables since migrations 0006/0007;
-- event_content only carries hero / agenda / gallery / faq now.
insert into public.event_content (event_id, hero, agenda, gallery, faq)
select
  e.id,
  jsonb_build_object(
    'tagline_es', 'Construye con modelos. Mide en producción.',
    'tagline_en', 'Build with models. Measure in production.',
    'lede_es', 'Un sábado completo dedicado a llevar IA generativa más allá del demo: arquitectura, costos, evals y entrega real. Con speakers de Ecuador, Colombia y Perú.',
    'lede_en', 'A full Saturday dedicated to taking generative AI past the demo: architecture, cost, evals, and real shipping. Speakers from Ecuador, Colombia, and Peru.'
  ),
  '[
    {"time":"09:00","dur":30,"title_es":"Registro y desayuno","title_en":"Check-in & breakfast","track":null,"room":"Lobby"},
    {"time":"09:30","dur":30,"title_es":"Bienvenida + estado del capítulo","title_en":"Welcome + chapter update","track":"Plenaria","room":"Auditorio A"},
    {"time":"10:00","dur":50,"title_es":"Keynote: Agentes en producción, lecciones de un año","title_en":"Keynote: Agents in production, a year of lessons","track":"Plenaria","room":"Auditorio A","speaker":"María Cabrera"},
    {"time":"11:00","dur":45,"title_es":"Workshop: Gemini API + tool use desde cero","title_en":"Workshop: Gemini API + tool use from scratch","track":"Hands-on","room":"Sala 1","speaker":"Diego Salinas"},
    {"time":"11:00","dur":45,"title_es":"Talk: Evals que no mienten","title_en":"Talk: Evals that don''t lie","track":"AI Engineering","room":"Auditorio A","speaker":"Lucía Vega"},
    {"time":"12:00","dur":60,"title_es":"Almuerzo + networking","title_en":"Lunch + networking","track":null,"room":"Patio"},
    {"time":"13:00","dur":45,"title_es":"Talk: RAG en español, lo que rompe","title_en":"Talk: RAG in Spanish, what breaks","track":"AI Engineering","room":"Auditorio A","speaker":"Andrés Pacheco"},
    {"time":"13:00","dur":45,"title_es":"Workshop: Fine-tuning con Vertex AI","title_en":"Workshop: Fine-tuning with Vertex AI","track":"Hands-on","room":"Sala 1","speaker":"Camila Ruiz"},
    {"time":"14:00","dur":45,"title_es":"Panel: Costos reales de IA en startups latam","title_en":"Panel: Real AI costs at LatAm startups","track":"Plenaria","room":"Auditorio A"},
    {"time":"15:00","dur":60,"title_es":"Hackathon flash: agentes con propósito","title_en":"Flash hackathon: agents with purpose","track":"Hands-on","room":"Sala 1+2"},
    {"time":"17:00","dur":30,"title_es":"Lightning talks comunitarias","title_en":"Community lightning talks","track":"Plenaria","room":"Auditorio A"},
    {"time":"18:00","dur":60,"title_es":"Cierre + after en planta baja","title_en":"Closing + after-party downstairs","track":null,"room":"Patio"}
  ]'::jsonb,
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
