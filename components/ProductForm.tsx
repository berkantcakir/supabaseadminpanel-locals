"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Save,
  X,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  Package,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number;
    discount_percentage: number | null;
    stock: number;
    category_id: string | null;
    is_visible: boolean;
    is_on_campaign: boolean;
    sort_order: number;
    category_sort_order: number | null;
    grammage: number | null;
  };
}

export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const isEditing = !!product;

  // Form state
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [discountPercentage, setDiscountPercentage] = useState(
    product?.discount_percentage?.toString() ?? ""
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isVisible, setIsVisible] = useState(product?.is_visible ?? true);
  const [isOnCampaign, setIsOnCampaign] = useState(
    product?.is_on_campaign ?? false
  );
  const [sortOrder, setSortOrder] = useState(
    product?.sort_order?.toString() ?? "0"
  );
  const [categorySortOrder, setCategorySortOrder] = useState(
    product?.category_sort_order?.toString() ?? ""
  );
  const [grammage, setGrammage] = useState(
    product?.grammage?.toString() ?? ""
  );

  // Image state
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url ?? "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [saving, setSaving] = useState(false);

  // Görüntü işlemleri
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir resim dosyası seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resim boyutu 5MB'dan küçük olmalıdır.");
      return;
    }
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error("Resim yüklenirken hata oluştu: " + uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch {
      toast.error("Resim yüklenemedi.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Ürün adı zorunludur.");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      // Yeni resim seçildiyse yükle
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (!uploaded) {
          setSaving(false);
          return;
        }
        finalImageUrl = uploaded;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        price: Number(price),
        discount_percentage: discountPercentage
          ? Number(discountPercentage)
          : null,
        stock: Number(stock),
        category_id: categoryId || null,
        is_visible: isVisible,
        is_on_campaign: isOnCampaign,
        sort_order: Number(sortOrder),
        category_sort_order: categorySortOrder
          ? Number(categorySortOrder)
          : null,
        grammage: grammage ? Number(grammage) : null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);

        if (error) {
          toast.error("Ürün güncellenirken hata: " + error.message);
          setSaving(false);
          return;
        }
        toast.success("Ürün başarıyla güncellendi!");
      } else {
        const { error } = await supabase.from("products").insert(payload);

        if (error) {
          toast.error("Ürün eklenirken hata: " + error.message);
          setSaving(false);
          return;
        }
        toast.success("Ürün başarıyla eklendi!");
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol kolon - Ana bilgiler */}
        <div className="lg:col-span-2 space-y-5">
          {/* Temel Bilgiler */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Temel Bilgiler
            </h2>
            <div className="space-y-4">
              {/* Ürün Adı */}
              <div>
                <label className={labelClass}>
                  Ürün Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ürün adını girin"
                  className={inputClass}
                  required
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className={labelClass}>Açıklama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürün açıklaması..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Fiyat & İndirim */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Fiyat (₺) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>İndirim (%)</label>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Stok & Gramaj */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stok</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gramaj</label>
                  <input
                    type="number"
                    value={grammage}
                    onChange={(e) => setGrammage(e.target.value)}
                    placeholder="Örn: 500"
                    min="0"
                    step="0.01"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organizasyon */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-5">
              Organizasyon
            </h2>
            <div className="space-y-4">
              {/* Kategori */}
              <div>
                <label className={labelClass}>Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Kategori seçin</option>
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((parent) => (
                      <optgroup key={parent.id} label={parent.name}>
                        <option value={parent.id}>{parent.name}</option>
                        {categories
                          .filter((c) => c.parent_id === parent.id)
                          .map((child) => (
                            <option key={child.id} value={child.id}>
                              &nbsp;&nbsp;↳ {child.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  {/* Üst kategorisi olmayanlar */}
                  {categories
                    .filter(
                      (c) =>
                        !c.parent_id &&
                        !categories.some((p) => p.parent_id === c.id)
                    )
                    .filter(
                      (c) => !categories.some((ch) => ch.parent_id === c.id)
                    )
                    .map((c) => (
                      <option key={`flat-${c.id}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Sıra */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Sıra No</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kategori Sırası</label>
                  <input
                    type="number"
                    value={categorySortOrder}
                    onChange={(e) => setCategorySortOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ kolon - Resim & Durum */}
        <div className="space-y-5">
          {/* Ürün Resmi */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Ürün Resmi
            </h2>

            {imagePreview ? (
              <div className="relative">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-700">
                  <Image
                    src={imagePreview}
                    alt="Ürün resmi"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                }`}
              >
                <Upload
                  className={`w-8 h-8 mb-2 ${isDragging ? "text-emerald-400" : "text-slate-400"}`}
                />
                <p className="text-slate-400 text-sm text-center px-4">
                  Resim yüklemek için tıklayın
                  <br />
                  <span className="text-slate-500 text-xs">
                    veya sürükleyip bırakın
                  </span>
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  PNG, JPG, WEBP (max 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imagePreview && (
              <div className="mt-3">
                <label className={labelClass}>veya URL girin</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Durum */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Durum</h2>
            <div className="space-y-3">
              {/* Görünürlük */}
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-slate-700/50 transition-all">
                <div>
                  <p className="text-white text-sm font-medium">Görünür</p>
                  <p className="text-slate-400 text-xs">
                    Ürün mağazada gösterilsin
                  </p>
                </div>
                <div
                  onClick={() => setIsVisible(!isVisible)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    isVisible ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isVisible ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>

              {/* Kampanya */}
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-slate-700/50 transition-all">
                <div>
                  <p className="text-white text-sm font-medium">Kampanyalı</p>
                  <p className="text-slate-400 text-xs">
                    Kampanya ürünlerinde göster
                  </p>
                </div>
                <div
                  onClick={() => setIsOnCampaign(!isOnCampaign)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    isOnCampaign ? "bg-orange-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isOnCampaign ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-emerald-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? "Güncelle" : "Kaydet"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}


