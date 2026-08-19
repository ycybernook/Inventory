-- ============================================================================
-- Storage buckets: product images (public), payment proofs & receipts (private)
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- product-images: anyone can view; managers+ can upload/manage
create policy "product-images read" on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product-images write" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_manager_up());

create policy "product-images update" on storage.objects for update
  using (bucket_id = 'product-images' and is_manager_up());

create policy "product-images delete" on storage.objects for delete
  using (bucket_id = 'product-images' and is_owner());

-- payment-proofs: uploader + staff can read; authenticated users can upload
-- into their own order's folder (path convention: <order_id>/<filename>)
create policy "payment-proofs read" on storage.objects for select
  using (
    bucket_id = 'payment-proofs' and (
      is_staff() or
      exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[1]
          and (o.customer_id = auth.uid() or o.created_by = auth.uid())
      )
    )
  );

create policy "payment-proofs write" on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs' and
    exists (
      select 1 from orders o
      where o.id::text = (storage.foldername(name))[1]
        and (o.customer_id = auth.uid() or o.created_by = auth.uid())
    )
  );

-- receipts: same order participants can read; only staff can write
create policy "receipts read" on storage.objects for select
  using (
    bucket_id = 'receipts' and (
      is_staff() or
      exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[1]
          and (o.customer_id = auth.uid() or o.created_by = auth.uid())
      )
    )
  );

create policy "receipts write" on storage.objects for insert
  with check (bucket_id = 'receipts' and is_manager_up());
