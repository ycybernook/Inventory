"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/app/admin/products/actions";
import type { Category, Product } from "@/lib/database.types";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, formAction, pending] = useActionState(saveProductAction, undefined);

  return (
    <form action={formAction} className="bg-bg-raised border border-line rounded-2xl p-6 flex flex-col gap-4 max-w-xl">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU" name="sku" defaultValue={product?.sku} required />
        <Field label="Unit" name="unit" defaultValue={product?.unit ?? "pc"} required />
      </div>

      <Field label="Name" name="name" defaultValue={product?.name} required />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={2}
          className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Category</span>
        <select
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (₱)" name="price" type="number" step="0.01" defaultValue={product?.price} required />
        <Field label="Cost (₱)" name="cost" type="number" step="0.01" defaultValue={product?.cost ?? undefined} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Stock qty" name="stock_qty" type="number" defaultValue={product?.stock_qty ?? 0} required />
        <Field label="Reorder point" name="reorder_point" type="number" defaultValue={product?.reorder_point ?? 10} required />
      </div>

      <Field label="Image path" name="image_path" defaultValue={product?.image_path ?? ""} placeholder="/products/example.svg" />

      {state?.error && <p className="text-sm text-critical">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : product ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        step={props.step}
        defaultValue={props.defaultValue}
        required={props.required}
        placeholder={props.placeholder}
        className="rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}
