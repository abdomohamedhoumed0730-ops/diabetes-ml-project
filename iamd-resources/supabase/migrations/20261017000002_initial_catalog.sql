-- =============================================================================
-- Catalogue initial — catégories de départ, NON officielles.
-- Ces matières sont des catégories indicatives destinées à structurer la
-- plateforme ; elles doivent être ajustées par l'administrateur selon la
-- maquette officielle du Master IAMD (ajout, renommage, suppression depuis
-- l'espace d'administration). Aucun document n'est créé ici.
-- =============================================================================

with program as (
  insert into public.programs (slug, name, short_name, description, institution, sort_order)
  values (
    'master-iamd',
    'Master Intelligence Artificielle et Modélisation des Données',
    'IAMD',
    'Formation de Master orientée vers l''intelligence artificielle, la science des données et la modélisation mathématique.',
    'Université de Djibouti',
    1
  )
  returning id
),
lvl as (
  insert into public.levels (program_id, name, sort_order)
  select program.id, v.name, v.sort_order
  from program, (values ('Master 1', 1), ('Master 2', 2)) as v(name, sort_order)
  returning id, name
),
sem as (
  insert into public.semesters (level_id, name, sort_order)
  select lvl.id, v.name, v.sort_order
  from lvl
  join (values ('Master 1', 'Semestre 1', 1), ('Master 1', 'Semestre 2', 2),
               ('Master 2', 'Semestre 3', 3), ('Master 2', 'Semestre 4', 4)) as v(level_name, name, sort_order)
    on v.level_name = lvl.name
  returning id
)
insert into public.subjects (level_id, slug, name, short_description, icon, sort_order)
select lvl.id, v.slug, v.name, v.short_description, v.icon, v.sort_order
from lvl
cross join (values
  ('big-data', 'Gestion des Données Massives (Big Data)', 'Stockage, traitement distribué et architectures pour les grands volumes de données.', 'database', 1),
  ('intelligence-artificielle', 'Intelligence artificielle', 'Fondements de l''IA : recherche, raisonnement, représentation des connaissances.', 'brain', 2),
  ('machine-learning', 'Machine Learning', 'Apprentissage supervisé et non supervisé, évaluation et sélection de modèles.', 'cpu', 3),
  ('deep-learning', 'Deep Learning', 'Réseaux de neurones profonds, CNN, RNN, Transformers et entraînement.', 'network', 4),
  ('nlp', 'Traitement automatique du langage naturel (NLP)', 'Représentation du texte, modèles de langue et applications du NLP.', 'message-square-text', 5),
  ('modelisation-statistique', 'Modélisation statistique', 'Inférence, régression, modèles linéaires généralisés et validation.', 'sigma', 6),
  ('optimisation-mathematique', 'Optimisation mathématique', 'Optimisation convexe, méthodes de gradient et optimisation sous contraintes.', 'trending-down', 7),
  ('analyse-visualisation-donnees', 'Analyse et visualisation des données', 'Exploration, préparation et visualisation des données.', 'bar-chart', 8),
  ('bases-de-donnees-sql', 'Bases de données et SQL', 'Modélisation relationnelle, SQL et systèmes de gestion de bases de données.', 'table', 9),
  ('programmation-python-r', 'Programmation Python et R', 'Programmation scientifique et écosystèmes Python et R pour la data science.', 'code', 10),
  ('recherche-operationnelle', 'Recherche opérationnelle', 'Programmation linéaire, graphes, ordonnancement et aide à la décision.', 'route', 11),
  ('projets-travaux-pratiques', 'Projets et travaux pratiques', 'Projets transversaux et travaux pratiques appliqués.', 'folder-kanban', 12)
) as v(slug, name, short_description, icon, sort_order)
where lvl.name = 'Master 2';

-- Exemple de fiche projet, explicitement marqué comme fictif (is_example = true).
-- Il illustre la structure d'une fiche et peut être supprimé par l'administrateur.
insert into public.projects (
  slug, title, category, subject_id, summary, description, objectives,
  technologies, steps, prerequisites, difficulty, is_example, is_published
)
select
  'exemple-classification-supervisee',
  'Exemple : classification supervisée de bout en bout',
  'machine_learning',
  s.id,
  'Fiche d''exemple illustrant la structure d''un projet. Aucun rapport ni résultat n''est associé.',
  'Ceci est un exemple fictif destiné à montrer comment présenter un projet sur la plateforme. Il décrit un déroulé type de projet de classification supervisée sur un jeu de données public, sans fournir de résultats expérimentaux.',
  'Comprendre les étapes d''un projet de Machine Learning : préparation des données, entraînement, évaluation et restitution.',
  array['Python', 'pandas', 'scikit-learn', 'Jupyter'],
  array[
    'Choisir un jeu de données public dont la licence autorise la réutilisation',
    'Explorer et nettoyer les données',
    'Séparer les données en ensembles d''entraînement et de test',
    'Entraîner et comparer plusieurs modèles',
    'Évaluer les modèles avec des métriques adaptées',
    'Rédiger un rapport présentant la démarche et ses limites'
  ],
  'Bases de Python, notions de statistiques descriptives, principes de l''apprentissage supervisé.',
  'intermediaire',
  true,
  true
from public.subjects s
where s.slug = 'machine-learning';
