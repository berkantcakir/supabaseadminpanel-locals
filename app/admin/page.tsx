import { createClient } from "@/lib/supabase/server";
import { Package, Tag, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: categoryCount }, { count: visibleCount }, { count: campaignCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_visible", true),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_on_campaign", true),
    ]);

  const stats = [
    {
      label: "Toplam Ürün",
      value: productCount ?? 0,
      icon: Package,
      color: "bg-blue-500/20 text-blue-400",
      href: "/admin/products",
    },
    {
      label: "Kategori",
      value: categoryCount ?? 0,
      icon: Tag,
      color: "bg-purple-500/20 text-purple-400",
      href: "/admin/products",
    },
    {
      label: "Görünür Ürün",
      value: visibleCount ?? 0,
      icon: Eye,
      color: "bg-emerald-500/20 text-emerald-400",
      href: "/admin/products",
    },
    {
      label: "Kampanyalı Ürün",
      value: campaignCount ?? 0,
      icon: TrendingUp,
      color: "bg-orange-500/20 text-orange-400",
      href: "/admin/products",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Mağazanıza genel bakış</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-all hover:shadow-lg group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Hızlı Erişim</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium text-sm"
          >
            <Package className="w-4 h-4" />
            Yeni Ürün Ekle
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium text-sm"
          >
            <Eye className="w-4 h-4" />
            Ürünleri Görüntüle
          </Link>
        </div>
      </div>
    </div>
  );
}


