import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Admin rolünü kontrol et
  const { data: userData } = await supabase
    .from("users")
    .select("role, name, phone")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar user={userData} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}


