import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .order("name", { ascending: true });

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/products"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6 text-emerald-400" />
            Yeni Ürün Ekle
          </h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            Yeni bir ürün oluşturun
          </p>
        </div>
      </div>

      <ProductForm categories={categories ?? []} />
    </div>
  );
}


