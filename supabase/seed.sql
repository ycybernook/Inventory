-- ============================================================================
-- Example catalog data. Run after migrations:
--   supabase db reset   (local)  or  psql < seed.sql  (remote)
-- Product images live in /public/products/*.svg in the Next.js app and are
-- referenced by a simple relative path — managers/owners can replace them
-- with real photos uploaded to the `product-images` storage bucket later.
-- ============================================================================

insert into categories (name, sort_order) values
  ('Masonry', 1),
  ('Electrical', 2),
  ('Plumbing', 3),
  ('Paint', 4),
  ('Tools', 5),
  ('Safety', 6)
on conflict (name) do nothing;

insert into products (sku, name, description, category_id, unit, price, cost, image_path, stock_qty, reorder_point)
select v.sku, v.name, v.description, c.id, v.unit, v.price, v.cost, v.image_path, v.stock_qty, v.reorder_point
from (values
  ('CEM-001', 'Portland Cement 40kg', 'Type I general purpose Portland cement.', 'Masonry', 'bag', 305.00, 255.00, '/products/cement.svg', 184, 40),
  ('MAS-014', 'Umbrella Nails 1kg', 'Galvanized umbrella-head roofing nails.', 'Masonry', 'pack', 145.00, 110.00, '/products/nails.svg', 8, 15),
  ('ELE-007', 'THHN Wire #12 (75m)', 'Stranded copper THHN wire, 75-meter roll.', 'Electrical', 'roll', 1890.00, 1620.00, '/products/wire.svg', 5, 6),
  ('ELE-021', 'Extension Cord 10m Heavy Duty', '3-outlet heavy-duty extension cord.', 'Electrical', 'pc', 520.00, 410.00, '/products/cord.svg', 37, 10),
  ('PLM-003', 'PVC Pipe 4in x 3m', 'Schedule 40 PVC drainage pipe.', 'Plumbing', 'pc', 410.00, 340.00, '/products/pipe.svg', 62, 12),
  ('PLM-018', 'Ball Valve 1/2in Brass', 'Full-port brass ball valve.', 'Plumbing', 'pc', 165.00, 120.00, '/products/valve.svg', 0, 10),
  ('PNT-009', 'Latex Paint 4L (White)', 'Water-based interior/exterior latex paint.', 'Paint', 'pail', 980.00, 810.00, '/products/paint.svg', 11, 12),
  ('PNT-015', 'Paint Roller Set 9"', '9-inch roller frame with two covers.', 'Paint', 'set', 210.00, 150.00, '/products/roller.svg', 44, 10),
  ('TL-002', 'Claw Hammer 16oz', 'Forged steel claw hammer, fiberglass handle.', 'Tools', 'pc', 295.00, 225.00, '/products/hammer.svg', 58, 10),
  ('SAF-006', 'Safety Helmet ANSI', 'ANSI-rated hard hat with ratchet suspension.', 'Safety', 'pc', 255.00, 190.00, '/products/helmet.svg', 26, 8)
) as v(sku, name, description, category_name, unit, price, cost, image_path, stock_qty, reorder_point)
join categories c on c.name = v.category_name
on conflict (sku) do nothing;
