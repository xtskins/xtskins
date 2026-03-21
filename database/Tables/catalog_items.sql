-- Catálogo da vitrine (encomenda / fora do inventário Steam)
-- Migration aplicada no Supabase: create_catalog_items_and_order_items_catalog_fk

CREATE TABLE public.catalog_items (
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
