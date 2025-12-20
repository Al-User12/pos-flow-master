import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Store, ArrowRight, Package, Users, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RetailPOS</span>
          </div>
          <Link to="/auth">
            <Button variant="default" size="sm" className="gap-2">
              Masuk <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Package className="w-4 h-4" />
            Solusi POS Modern untuk Retail & FMCG
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Kelola Toko Anda dengan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-600">
              Lebih Mudah
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistem Point of Sale lengkap dengan manajemen inventory, tracking pengiriman, 
            dan program referral untuk mengembangkan bisnis Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Fitur Lengkap</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola bisnis retail dalam satu platform
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Pembeli Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Untuk Pembeli</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Belanja mudah dengan katalog lengkap, tracking order real-time, dan program referral untuk mendapatkan komisi.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Katalog produk lengkap
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Tracking order real-time
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Komisi referral
              </li>
            </ul>
          </div>

          {/* Kurir Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <Truck className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Untuk Pengirim</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Terima order, update status pengiriman, dan upload bukti pengantaran dengan mudah.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Terima order fleksibel
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Update status real-time
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Proof of Delivery
              </li>
            </ul>
          </div>

          {/* Admin Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Store className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Untuk Admin</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Kelola produk, inventory, order, keuangan, dan laporan dalam satu dashboard.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Manajemen inventory & HPP
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Konfirmasi pembayaran
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Laporan & audit lengkap
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aman & Terpercaya
              </h3>
              <p className="text-muted-foreground">
                Data Anda dilindungi dengan enkripsi tingkat enterprise. Semua transaksi tercatat 
                dalam audit trail untuk transparansi penuh.
              </p>
            </div>
            <div className="shrink-0">
              <Link to="/auth?mode=register">
                <Button className="gap-2">
                  <Users className="w-4 h-4" />
                  Mulai Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">RetailPOS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 RetailPOS. Solusi POS Modern untuk Bisnis Anda.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
