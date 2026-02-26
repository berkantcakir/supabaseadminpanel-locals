"use client";

import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronUp,
  ChevronDown,
  Tag,
  AlertTriangle,
  Package,
  Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  stock: number;
  price: number;
  discount_percentage: number | null;
  is_visible: boolean;
  is_on_campaign: boolean;
  sort_order: number;
  categories: { id: string; name: string } | null;
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products: initialProducts }: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "sort_order">("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Loading state for button operations - prevents double clicks
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const supabase = createClient();

  // Sunucu fonksiyonu ile arama (search_products_v2)
  useEffect(() => {
    // 2 karakterden kısa ise, server araması yapma
    if (search.trim().length < 2) {
      setProducts(initialProducts);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("search_products_v2", {
          search_query: search.trim(),
          market_id_param: null, // Tüm marketler için; gerekirse burada market_id gönder
          limit_param: 50,
          offset_param: 0,
        });

        if (!active) return;

        if (error) {
          console.error("search_products_v2 error:", error);
          setIsSearching(false);
          return;
        }

        const mapped: Product[] =
          (data ?? []).map((row: any) => ({
            id: row.id,
            name: row.name,
            image_url: row.image_url,
            stock: row.stock,
            price: Number(row.price),
            discount_percentage: row.discount_percentage,
            is_visible: row.is_visible,
            is_on_campaign: row.is_on_campaign,
            sort_order: row.sort_order,
            categories: row.category
              ? { id: row.category_id ?? "", name: row.category }
              : null,
          })) ?? [];

        setProducts(mapped);
        setIsSearching(false);
      } catch (e) {
        console.error("search_products_v2 exception:", e);
        if (active) setIsSearching(false);
      }
    }, 350); // küçük bir debounce

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [search, supabase, initialProducts]);

  const filtered = products
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "price") return (a.price - b.price) * dir;
      if (sortField === "stock") return (a.stock - b.stock) * dir;
      return (a.sort_order - b.sort_order) * dir;
    });

  const handleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField, sortDir]);

  // Optimistic UI - updates immediately, rolls back on error
  const handleToggleVisible = useCallback(async (product: Product) => {
    if (loadingProductId) return; // Prevent double clicks

    // Immediately update UI (optimistic)
    const previousState = product.is_visible;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_visible: !p.is_visible } : p
      )
    );

    // Set loading state
    setLoadingProductId(product.id);

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_visible: !product.is_visible })
        .eq("id", product.id);

      if (error) {
        // Rollback on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_visible: previousState } : p
          )
        );
        toast.error("Güncelleme başarısız.");
      } else {
        toast.success(
          !product.is_visible ? "Ürün görünür yapıldı." : "Ürün gizlendi."
        );
      }
    } catch (e) {
      // Rollback on exception
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_visible: previousState } : p
        )
      );
      toast.error("Güncelleme başarısız.");
    } finally {
      setLoadingProductId(null);
    }
  }, [supabase, loadingProductId]);

  // Optimistic UI - removes immediately, rolls back on error
  const handleDelete = useCallback(async (id: string) => {
    if (loadingProductId) return; // Prevent double clicks

    // Store current products for rollback
    const previousProducts = products;

    // Immediately remove from UI (optimistic)
    setProducts((prev) => prev.filter((p) => p.id !== id));

    // Set loading state
    setLoadingProductId(id);

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        // Rollback on error
        setProducts(previousProducts);
        toast.error("Silme işlemi başarısız.");
        return;
      }

      setDeleteConfirm(null);
      toast.success("Ürün silindi.");
    } catch (e) {
      // Rollback on exception
      setProducts(previousProducts);
      toast.error("Silme işlemi başarısız.");
    } finally {
      setLoadingProductId(null);
    }
  }, [supabase, products, loadingProductId]);

  const SortIcon = memo(({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-emerald-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-emerald-400" />
    );
  });
  SortIcon.displayName = "SortIcon";

  return (
    <div>
      {/* Arama */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ürün veya kategori ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">
            Aranıyor...
          </span>
        )}
      </div>

      {/* Tablo */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 backdrop-blur">
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium w-16">
                  Resim
                </th>
                <th
                  className="text-left px-4 py-3 text-slate-400 text-sm font-medium cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Ürün Adı <SortIcon field="name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">
                  Kategori
                </th>
                <th
                  className="text-left px-4 py-3 text-slate-400 text-sm font-medium cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center gap-1">
                    Fiyat <SortIcon field="price" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-slate-400 text-sm font-medium cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center gap-1">
                    Stok <SortIcon field="stock" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">
                  Durum
                </th>
                <th
                  className="text-left px-4 py-3 text-slate-400 text-sm font-medium cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("sort_order")}
                >
                  <div className="flex items-center gap-1">
                    Sıra <SortIcon field="sort_order" />
                  </div>
                </th>
                <th className="text-right px-4 py-3 text-slate-400 text-sm font-medium">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Ürün bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Resim */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </td>

                    {/* Ad */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {product.name}
                        </p>
                        {product.is_on_campaign && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-400 mt-0.5">
                            <Tag className="w-3 h-3" />
                            Kampanyalı
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">
                        {product.categories?.name || (
                          <span className="text-slate-600 italic">-</span>
                        )}
                      </span>
                    </td>

                    {/* Fiyat */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white font-semibold text-sm">
                          ₺{Number(product.price).toFixed(2)}
                        </span>
                        {product.discount_percentage && Number(product.discount_percentage) > 0 ? (
                          <span className="ml-2 text-xs text-red-400">
                            %{product.discount_percentage}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          product.stock === 0
                            ? "text-red-400"
                            : product.stock < 5
                            ? "text-orange-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {product.stock === 0 && (
                          <AlertTriangle className="w-3 h-3" />
)}
                        {product.stock}
                      </span>
                    </td>

                    {/* Durum */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVisible(product)}
                        disabled={loadingProductId === product.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          product.is_visible
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        } ${loadingProductId === product.id ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {loadingProductId === product.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : product.is_visible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Görünür
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Gizli
                          </>
                        )}
                      </button>
                    </td>

                    {/* Sıra */}
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">
                        {product.sort_order}
                      </span>
                    </td>

                    {/* İşlemler */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={loadingProductId === product.id}
                              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-all flex items-center gap-1"
                            >
                              {loadingProductId === product.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Evet"
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              disabled={loadingProductId === product.id}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs rounded-lg transition-all"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700/50 text-slate-400 text-sm">
            {filtered.length} ürün gösteriliyor
            {search && ` ("${search}" araması)`}
          </div>
        )}
      </div>
    </div>
  );
}
