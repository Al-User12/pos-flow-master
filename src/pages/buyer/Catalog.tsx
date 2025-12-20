import { useState, useMemo } from 'react';
import { Search, Package, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { ProductCard } from '@/components/buyer/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: products, isLoading: productsLoading } = useProducts(selectedCategory);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const productCount = filteredProducts.length;
  const inStockCount = filteredProducts.filter(p => p.availableStock > 0).length;

  return (
    <BuyerLayout>
      {/* Hero Section */}
      <div className="relative mb-6 -mx-4 -mt-4 px-4 py-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Katalog Produk
          </h1>
          <p className="text-muted-foreground text-sm">
            Temukan produk terbaik dengan harga kompetitif
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk atau kategori..."
          className="pl-10 h-11 bg-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs"
            onClick={() => setSearchQuery('')}
          >
            Hapus
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(undefined)}
          className={cn(
            "shrink-0 transition-all",
            !selectedCategory && "shadow-md"
          )}
        >
          <Package className="w-3.5 h-3.5 mr-1.5" />
          Semua
        </Button>
        {categoriesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-md" />
          ))
        ) : (
          categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "shrink-0 transition-all",
                selectedCategory === category.id && "shadow-md"
              )}
            >
              {category.name}
            </Button>
          ))
        )}
      </div>

      {/* Product Count & Filter Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {productsLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              <>
                <span className="font-medium text-foreground">{productCount}</span> produk
                {searchQuery && ` untuk "${searchQuery}"`}
              </>
            )}
          </span>
          {!productsLoading && inStockCount < productCount && (
            <Badge variant="secondary" className="text-xs">
              {inStockCount} tersedia
            </Badge>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Produk Tidak Ditemukan
          </h3>
          <p className="text-muted-foreground text-center text-sm max-w-xs mb-4">
            {searchQuery 
              ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
              : 'Tidak ada produk dalam kategori ini'}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(undefined);
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.latestPrice?.selling_price || 0}
                imageUrl={product.image_url || undefined}
                stock={product.availableStock}
                categoryName={product.category?.name}
              />
            </div>
          ))}
        </div>
      )}
    </BuyerLayout>
  );
}
