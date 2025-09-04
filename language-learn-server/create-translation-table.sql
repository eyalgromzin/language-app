-- Create translation table with columns for each language
-- Each language column will store the translated text for that language
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    cs TEXT,    -- Czech
    de TEXT,    -- German
    el TEXT,    -- Greek
    en TEXT,    -- English
    es TEXT,    -- Spanish
    fi TEXT,    -- Finnish
    fr TEXT,    -- French
    he TEXT,    -- Hebrew
    hi TEXT,    -- Hindi
    it TEXT,    -- Italian
    nl TEXT,    -- Dutch
    no TEXT,    -- Norwegian
    pl TEXT,    -- Polish
    pt TEXT,    -- Portuguese
    ru TEXT,    -- Russian
    sv TEXT,    -- Swedish
    th TEXT,    -- Thai
    uk TEXT,    -- Ukrainian
    vi TEXT     -- Vietnamese
);

-- Create indexes on all language columns for efficient lookups
CREATE INDEX IF NOT EXISTS idx_translations_cs ON translations(cs);
CREATE INDEX IF NOT EXISTS idx_translations_de ON translations(de);
CREATE INDEX IF NOT EXISTS idx_translations_el ON translations(el);
CREATE INDEX IF NOT EXISTS idx_translations_en ON translations(en);
CREATE INDEX IF NOT EXISTS idx_translations_es ON translations(es);
CREATE INDEX IF NOT EXISTS idx_translations_fi ON translations(fi);
CREATE INDEX IF NOT EXISTS idx_translations_fr ON translations(fr);
CREATE INDEX IF NOT EXISTS idx_translations_he ON translations(he);
CREATE INDEX IF NOT EXISTS idx_translations_hi ON translations(hi);
CREATE INDEX IF NOT EXISTS idx_translations_it ON translations(it);
CREATE INDEX IF NOT EXISTS idx_translations_nl ON translations(nl);
CREATE INDEX IF NOT EXISTS idx_translations_no ON translations(no);
CREATE INDEX IF NOT EXISTS idx_translations_pl ON translations(pl);
CREATE INDEX IF NOT EXISTS idx_translations_pt ON translations(pt);
CREATE INDEX IF NOT EXISTS idx_translations_ru ON translations(ru);
CREATE INDEX IF NOT EXISTS idx_translations_sv ON translations(sv);
CREATE INDEX IF NOT EXISTS idx_translations_th ON translations(th);
CREATE INDEX IF NOT EXISTS idx_translations_uk ON translations(uk);
CREATE INDEX IF NOT EXISTS idx_translations_vi ON translations(vi);

-- Add comments to document the table structure
COMMENT ON TABLE translations IS 'Stores translations for words/phrases across all supported languages';
COMMENT ON COLUMN translations.id IS 'Primary key for the translation record';
COMMENT ON COLUMN translations.cs IS 'Czech translation';
COMMENT ON COLUMN translations.de IS 'German translation';
COMMENT ON COLUMN translations.el IS 'Greek translation';
COMMENT ON COLUMN translations.en IS 'English translation';
COMMENT ON COLUMN translations.es IS 'Spanish translation';
COMMENT ON COLUMN translations.fi IS 'Finnish translation';
COMMENT ON COLUMN translations.fr IS 'French translation';
COMMENT ON COLUMN translations.he IS 'Hebrew translation';
COMMENT ON COLUMN translations.hi IS 'Hindi translation';
COMMENT ON COLUMN translations.it IS 'Italian translation';
COMMENT ON COLUMN translations.nl IS 'Dutch translation';
COMMENT ON COLUMN translations.no IS 'Norwegian translation';
COMMENT ON COLUMN translations.pl IS 'Polish translation';
COMMENT ON COLUMN translations.pt IS 'Portuguese translation';
COMMENT ON COLUMN translations.ru IS 'Russian translation';
COMMENT ON COLUMN translations.sv IS 'Swedish translation';
COMMENT ON COLUMN translations.th IS 'Thai translation';
COMMENT ON COLUMN translations.uk IS 'Ukrainian translation';
COMMENT ON COLUMN translations.vi IS 'Vietnamese translation';
