-- seed.sql
-- Local-dev seed data for the GDG Guayaquil platform.
-- Mirrors apps/web-main/lib/data.ts so the local stack serves the same
-- events and event_content as the prototype.

-- ─────────────── events ───────────────
insert into public.events (
  slug, name, type, year, status, language_mode,
  start_at, end_at, timezone,
  venue_name, venue_address, venue_map_url,
  ticket_url, leaderboard_enabled, theme_key
) values
(
  'bwai-2026', 'Build with AI', 'build_with_ai', 2026, 'published', 'bilingual',
  '2026-05-23 09:00:00-05', '2026-05-23 19:00:00-05', 'America/Guayaquil',
  'ESPOL — Centro de Convenciones',
  'Km 30.5 Vía Perimetral, Guayaquil',
  null,
  'https://gdggye.org/bwai-2026/tickets',
  true,
  'gdggye-core'
),
(
  'devfest-2026', 'DevFest', 'devfest', 2026, 'published', 'bilingual',
  '2026-11-14 08:30:00-05', '2026-11-14 20:00:00-05', 'America/Guayaquil',
  'Universidad Casa Grande — Auditorio',
  'Av. Las Palmas 304, Guayaquil',
  null,
  'https://gdggye.org/devfest-2026/tickets',
  true,
  'gdggye-core'
),
(
  'io-extended-2026', 'I/O Extended', 'google_io', 2026, 'published', 'bilingual',
  '2026-06-20 14:00:00-05', '2026-06-20 20:00:00-05', 'America/Guayaquil',
  'Innopolis Hub',
  'Cdla. Kennedy Norte, Guayaquil',
  null,
  'https://gdggye.org/io-extended-2026/tickets',
  false,
  'gdggye-core'
);

-- ─────────────── event_content for bwai-2026 ───────────────
insert into public.event_content (event_id, hero, agenda, speakers, sponsors, gallery, faq)
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
  '[
    {"name":"María Cabrera","role_es":"Staff AI Eng · Mercado Libre","role_en":"Staff AI Eng · Mercado Libre","city":"Bogotá"},
    {"name":"Diego Salinas","role_es":"GDE Cloud · Independiente","role_en":"GDE Cloud · Independent","city":"Quito"},
    {"name":"Lucía Vega","role_es":"Senior ML Eng · Kushki","role_en":"Senior ML Eng · Kushki","city":"Guayaquil"},
    {"name":"Andrés Pacheco","role_es":"Founding Eng · Truora","role_en":"Founding Eng · Truora","city":"Lima"},
    {"name":"Camila Ruiz","role_es":"Customer Eng · Google Cloud","role_en":"Customer Eng · Google Cloud","city":"CDMX"},
    {"name":"Joel Mendoza","role_es":"CTO · Banco Pichincha Labs","role_en":"CTO · Banco Pichincha Labs","city":"Guayaquil"},
    {"name":"Valentina Soto","role_es":"Founder · evals.dev","role_en":"Founder · evals.dev","city":"Santiago"},
    {"name":"Rafael Castro","role_es":"AI PM · Despegar","role_en":"AI PM · Despegar","city":"BA"}
  ]'::jsonb,
  '{
    "platinum":  [{"name":"Banco Pichincha"},{"name":"Kushki"}],
    "gold":      [{"name":"Pacifico Cloud"},{"name":"Truora"},{"name":"Despegar"}],
    "silver":    [{"name":"evals.dev"},{"name":"Innopolis"},{"name":"Aeris"},{"name":"Forma.ai"}],
    "community": [{"name":"ESPOL"},{"name":"GDG Quito"},{"name":"GDG Lima"},{"name":"WTM Ecuador"},{"name":"Laboratoria"},{"name":"Platzi"}]
  }'::jsonb,
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
