import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("categories")
      .select("id, name, parent_id")
      .order("name", { ascending: true }),
  ]);

  if (!product) {
    notFound();
  }

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
            <Edit className="w-6 h-6 text-emerald-400" />
            Ürün Düzenle
          </h1>
          <p className="text-slate-400 mt-0.5 text-sm truncate max-w-md">
            {product.name}
          </p>
        </div>
      </div>

      <ProductForm categories={categories ?? []} product={product} />
    </div>
  );
}


