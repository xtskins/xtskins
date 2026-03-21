-- Catálogo da vitrine (itens encomendáveis, fora do inventário Steam da loja)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  markethashname varchar(500) NOT NULL,
  marketname varchar(500) NOT NULL,
  image text NOT NULL,
  wear varchar(50) NOT NULL DEFAULT '',
  type varchar(100),
  sub_type varchar(100),
  list_price numeric(12,2) NOT NULL DEFAULT 0,
  discount_price numeric(12,2),
  reference_price_steam numeric(12,2),
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_items_visible_sort_idx
  ON public.catalog_items (is_visible, sort_order DESC);

COMMENT ON TABLE public.catalog_items IS 'Vitrine/catálogo (ex.: encomenda); não exige asset no inventário Steam';

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_items_select_public
  ON public.catalog_items FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS catalog_item_id uuid REFERENCES public.catalog_items(id);

ALTER TABLE public.order_items
  ALTER COLUMN skin_id DROP NOT NULL;

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_skin_or_catalog;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_skin_or_catalog CHECK (
    (skin_id IS NOT NULL AND catalog_item_id IS NULL)
    OR (skin_id IS NULL AND catalog_item_id IS NOT NULL)
  );
