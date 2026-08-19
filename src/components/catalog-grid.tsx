"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Product, Category } from "@/lib/database.types";
import { peso } from "@/lib/format";
import { addToCartAction } from "@/app/cart/actions";

function stockInfo(p: Product) {
  if (p.stock_qty === 0) return { cls: "out", label: "Out of stock" };
  if (p.stock_qty <= p.reorder_point) return { cls: "low", label: `Low · ${p.stock_qty} left` };
  return { cls: "in", label: `In stock · ${p.stock_qty}` };
}

const STOCK_CLASSES: Record<string, string> = {
  in: "bg-good-soft text-good",
  low: "bg-warn-soft text-warn",
  out: "bg-critical-soft text-critical",
};

export function CatalogGrid({
  products,
  categories,
  canOrder,
}: {
  products: Product[];
  categories: Category[];
  canOrder: boolean;
}) {
  const [activeCat, setActiveCat] = useState<string>("All");
  const [query, setQuery] = useState("");

  const catNames = ["All", ...categories.map((c) => c.name)];
  const catCountById = (name: string) =>
    name === "All" ? products.length : products.filter((p) => p.category_id && categories.find((c) => c.id === p.category_id)?.name === name).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catName = categories.find((c) => c.id === p.category_id)?.name;
      const matchCat = activeCat === "All" || catName === activeCat;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, categories, activeCat, query]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Browse Catalog</h1>
          <p className="text-sm text-ink-soft">{filtered.length} products</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-bg-raised px-3 py-2 min-w-[240px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-ink-faint flex-shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
            <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU…"
            className="bg-transparent outline-none text-sm w-full"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 md:hidden">
        {catNames.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap ${
              activeCat === c ? "bg-accent border-accent text-white font-semibold" : "border-line bg-bg-raised text-ink-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-7 items-start">
        <nav className="hidden md:flex flex-col gap-0.5 sticky top-20">
          <div className="text-xs uppercase tracking-wide text-ink-faint mb-2">Categories</div>
          {catNames.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm text-left ${
                activeCat === c ? "bg-accent-soft text-accent-ink font-semibold" : "text-ink-soft hover:bg-accent-soft hover:text-ink"
              }`}
            >
              <span>{c}</span>
              <span className="font-data text-xs text-ink-faint">{catCountById(c)}</span>
            </button>
          ))}
        </nav>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-ink-soft">
              <p className="font-display text-lg text-ink mb-1">No matches</p>
              Try a different search term or category.
            </div>
          )}
          {filtered.map((p) => {
            const stock = stockInfo(p);
            const catName = categories.find((c) => c.id === p.category_id)?.name;
            return (
              <article
                key={p.id}
                className="bg-bg-raised border border-line rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex flex-col"
              >
                <div className="aspect-[4/3] bg-accent-soft relative grid place-items-center">
                  {p.image_path && (
                    <Image src={p.image_path} alt={p.name} width={120} height={120} className="w-3/5 h-3/5 object-contain" />
                  )}
                  <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold font-data ${STOCK_CLASSES[stock.cls]}`}>
                    {stock.label}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <span className="text-[11px] uppercase tracking-wide text-accent-ink font-semibold">{catName}</span>
                  <h3 className="font-semibold text-sm leading-snug">{p.name}</h3>
                  <div className="text-xs text-ink-faint flex items-center gap-2">
                    <span className="font-data">{p.sku}</span>
                    <span>·</span>
                    <span>per {p.unit}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-line">
                    <span className="font-data font-semibold">
                      {peso(p.price)}
                      <span className="text-[11px] text-ink-faint font-normal">/{p.unit}</span>
                    </span>
                    {canOrder ? (
                      <form action={addToCartAction.bind(null, p.id, 1)}>
                        <button
                          type="submit"
                          disabled={p.stock_qty === 0}
                          className="h-8 w-8 rounded-lg border border-line-strong grid place-items-center hover:bg-accent hover:text-white hover:border-accent disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
                          aria-label={`Add ${p.name} to cart`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </form>
                    ) : (
                      <a href="/login" className="text-xs font-semibold text-accent-ink">
                        Log in to order
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
