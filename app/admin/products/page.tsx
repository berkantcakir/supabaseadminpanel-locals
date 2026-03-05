import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductsTable from "@/components/ProductsTable";
import { Plus, Package, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = await createClient();
  const { page } = await searchParams;

  const pageSize = 50;
  const currentPage = Math.max(1, Number(page) || 1);

  // Toplam kayıt sayısı
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name
      )
    `
    )
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Products fetch error:", error);
  }

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Package className="w-7 h-7 text-emerald-400" />
            Ürünler
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Toplam {total} ürün • Sayfa {safePage}/{totalPages}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 text-sm md:text-base"
        >
          <Plus className="w-5 h-5" />
          Yeni Ürün
        </Link>
      </div>

      <ProductsTable products={products ?? []} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 md:px-5 md:py-4">
          <p className="text-slate-400 text-sm">
            Sayfa {safePage} / {totalPages} •{" "}
            <span className="text-slate-300 font-medium">
              {products?.length ?? 0}
            </span>{" "}
            ürün gösteriliyor
          </p>

          <div className="flex items-center justify-end gap-2">
            <Link
              href={hasPrev ? `/admin/products?page=${safePage - 1}` : "#"}
              aria-disabled={!hasPrev}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border transition-all ${hasPrev
                ? "border-slate-600 text-slate-200 hover:bg-slate-700"
                : "border-slate-800 text-slate-500 cursor-not-allowed"
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Önceki
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {(() => {
                const windowSize = 5;
                let windowStart = Math.max(1, safePage - 2);
                let windowEnd = Math.min(totalPages, windowStart + windowSize - 1);
                windowStart = Math.max(1, windowEnd - windowSize + 1);

                const pages: number[] = [];
                for (let p = windowStart; p <= windowEnd; p++) {
                  pages.push(p);
                }

                return pages.map((pageNumber) => {
                  const isActive = pageNumber === safePage;

                  return (
                    <Link
                      key={pageNumber}
                      href={`/admin/products?page=${pageNumber}`}
                      className={`w-8 h-8 inline-flex items-center justify-center rounded-lg text-sm transition-all ${isActive
                        ? "bg-emerald-500 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                });
              })()}
            </div>

            <Link
              href={hasNext ? `/admin/products?page=${safePage + 1}` : "#"}
              aria-disabled={!hasNext}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border transition-all ${hasNext
                ? "border-slate-600 text-slate-200 hover:bg-slate-700"
                : "border-slate-800 text-slate-500 cursor-not-allowed"
                }`}
            >
              Sonraki
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

