-- Búsqueda tolerante a errores de tipeo (searchCatalog: word_similarity sobre texto sin tildes).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
