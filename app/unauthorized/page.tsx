import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-2xl mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Erişim Reddedildi</h1>
        <p className="text-slate-400 mb-8">
          Bu panele erişim yetkiniz yok. Sadece admin rolüne sahip kullanıcılar
          giriş yapabilir.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Giriş Sayfasına Dön
        </Link>
      </div>
    </div>
  );
}


