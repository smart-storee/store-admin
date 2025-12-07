'use client';

import React, { useState } from 'react';

interface HomeScreenConfig {
  hero: {
    enabled: boolean;
    images: string[];
    greetingText: string;
    showLocation: boolean;
  };
  categories: {
    enabled: boolean;
    showCount: number;
    title: string;
  };
  products: {
    enabled: boolean;
    showCount: number;
    title: string;
    featuredProductIds?: number[];
  };
  banners: {
    enabled: boolean;
    items: Array<{
      image: string;
      title: string;
      link?: string;
    }>;
  };
  dynamicContent: {
    enabled: boolean;
    sections: Array<{
      type: string;
      title: string;
      content: any;
    }>;
  };
  sectionOrder?: string[];
}

interface HomeScreenPreviewProps {
  config: HomeScreenConfig;
  isDarkMode?: boolean;
  products?: Array<{ 
    product_id: number; 
    product_name: string; 
    product_image?: string; 
    base_price: number;
    serves_count?: number;
    is_vegetarian?: number;
    is_bestseller?: number;
  }>;
  categories?: Array<{ category_id: number; category_name: string; category_image?: string }>;
  banners?: Array<{ id: number; image_url: string; title?: string }>;
  storeConfig?: { primary_color: string; secondary_color: string; app_name: string } | null;
}

export default function HomeScreenPreview({ config, isDarkMode = false, products = [], categories = [], banners = [], storeConfig = null }: HomeScreenPreviewProps) {
  // Get primary color from store config, default to green
  const primaryColor = storeConfig?.primary_color || '10b981';
  const secondaryColor = storeConfig?.secondary_color || '10b981';
  
  // Helper to convert hex to rgb for CSS
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.startsWith('#') ? hex : `#${hex}`);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 16, g: 185, b: 129 }; // Default green
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const primaryColorCss = `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`;

  return (
    <div className="relative">
      {/* Mobile Frame */}
      <div className="mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
        <div
          className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8"
          style={{
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            borderColor: isDarkMode ? '#334155' : '#e5e7eb',
          }}
        >
          {/* Status Bar */}
          <div
            className="h-6 flex items-center justify-between px-4 text-xs"
            style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}
          >
            <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: isDarkMode ? '#475569' : '#94a3b8' }}></div>
              <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: isDarkMode ? '#475569' : '#94a3b8' }}></div>
            </div>
          </div>

          {/* Screen Content */}
          <div
            className="overflow-y-auto"
            style={{
              height: '667px',
              backgroundColor: isDarkMode ? '#0f172a' : '#fafafa',
            }}
          >
            {/* Top Header - Delivery Status, Location */}
            <div className="px-4 pt-2 pb-3 bg-white border-b" style={{ borderColor: isDarkMode ? '#334155' : '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: primaryColorCss }}>
                  🚚 In 10 minutes
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔔</span>
                  <div className="relative">
                    <span className="text-lg">🛍️</span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">1</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📍</span>
                  <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#cbd5e1' : '#374151' }}>Sector 6</span>
                  <span className="text-xs">↓</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-base" style={{ color: '#9ca3af' }}>🔍</span>
                  <span className="text-sm" style={{ color: '#9ca3af' }}>Search Products...</span>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColorCss }}>
                  <span className="text-white text-base">⚙️</span>
                </div>
              </div>
            </div>


            {/* Render sections in configured order */}
            {(() => {
              const sectionOrder = config.sectionOrder || ['banners', 'products', 'categories'];
              const sections: React.ReactElement[] = [];

              sectionOrder.forEach((sectionType) => {
                switch (sectionType) {
                  case 'banners':
                    if (config.banners?.enabled && config.banners.items && config.banners.items.length > 0) {
                      sections.push(
                        <div key="banners" className="px-4 pt-2 pb-4">
                          <div className="relative h-44 rounded-2xl overflow-hidden">
                            <div className="relative w-full h-full" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #dbeafe 100%)' }}>
                              {config.banners.items.length > 1 ? (
                                <div className="absolute inset-0 p-5 flex items-center justify-between">
                                  <div>
                                    <h3 className="text-2xl font-extrabold mb-1" style={{ color: '#1f2937' }}>
                                      {config.banners.items[0].title || 'Hearty Breakfast'}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-400 text-sm">❤️</span>
                                      <span className="text-red-400 text-sm">❤️</span>
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                                      {config.banners.items.length} banner{config.banners.items.length > 1 ? 's' : ''} configured
                                    </p>
                                  </div>
                                  <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
                                    <span className="text-4xl">🍽️</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 p-5 flex items-center justify-between">
                                  <div>
                                    <h3 className="text-2xl font-extrabold mb-1" style={{ color: '#1f2937' }}>
                                      {config.banners.items[0].title || 'Hearty Breakfast'}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-400 text-sm">❤️</span>
                                      <span className="text-red-400 text-sm">❤️</span>
                                    </div>
                                  </div>
                                  <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
                                    <span className="text-4xl">🍽️</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {config.banners.items.length > 1 && (
                              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                                {config.banners.items.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: idx === 0 ? 'white' : 'rgba(255,255,255,0.5)' }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    break;
                  case 'products':
                    if (config.products?.enabled) {
                      sections.push(
                        <div key="products" className="mb-4">
                          <div className="px-4 pt-6 pb-3">
                            <h3 className="text-xl font-extrabold" style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                              {config.products.title || 'Featured Items'}
                            </h3>
                          </div>
                          <div className="px-4 pb-2">
                            {(() => {
                              const featuredIds = config.products.featuredProductIds || [];
                              const featuredProducts = products.filter(p => featuredIds.includes(p.product_id));
                              const displayProducts = featuredProducts.length > 0 
                                ? featuredProducts.slice(0, config.products.showCount || 6)
                                : products.slice(0, config.products.showCount || 6);
                              
                              return displayProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                  {displayProducts.map((product, index) => (
                                    <div
                                      key={product.product_id}
                                      className="rounded-2xl overflow-hidden shadow-md"
                                      style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                    >
                                      <div className="relative h-30 bg-gray-100">
                                        {product.product_image ? (
                                          <img
                                            src={product.product_image}
                                            alt={product.product_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-3xl">🍕</span></div>';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-3xl">🍕</span>
                                          </div>
                                        )}
                                        {product.is_bestseller === 1 && (
                                          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1" style={{ backgroundColor: '#22c55e' }}>
                                            <span>⭐</span>
                                            <span>Bestseller</span>
                                          </div>
                                        )}
                                        {product.is_vegetarian === 1 && (
                                          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: '#22c55e' }}></div>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <p className="text-xs mb-1" style={{ color: isDarkMode ? '#94a3b8' : '#6b7280', fontWeight: 500 }}>Serves {product.serves_count || 1}</p>
                                        <p className="text-sm font-bold mb-2 line-clamp-2" style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: 700 }}>
                                          {product.product_name}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <span className="text-base font-extrabold" style={{ color: primaryColorCss, fontWeight: 800 }}>
                                            ₹{product.base_price}
                                          </span>
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColorCss }}>
                                            <span className="text-white text-base">+</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                                  No products available
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    }
                    break;
                  case 'categories':
                    if (config.categories?.enabled) {
                      sections.push(
                        <div key="categories" className="mb-4">
                          <div className="px-4 pt-6 pb-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-extrabold" style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                                {config.categories.title || 'Food for every mood'}
                              </h3>
                              <button 
                                className="text-sm font-semibold px-0 py-0"
                                style={{ color: primaryColorCss }}
                              >
                                View All
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', height: '100px' }}>
                            {categories.slice(0, config.categories.showCount || 8).length > 0 ? categories.slice(0, config.categories.showCount || 8).map((category) => (
                              <div
                                key={category.category_id}
                                className="flex-shrink-0 w-20 text-center mr-3"
                              >
                                <div
                                  className="w-20 h-20 rounded-xl mb-1 overflow-hidden shadow-sm"
                                  style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                >
                                  {category.category_image ? (
                                    <img
                                      src={category.category_image}
                                      alt={category.category_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-2xl">📦</span></div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-2xl">📦</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-semibold line-clamp-2 text-center" style={{ color: isDarkMode ? '#cbd5e1' : '#4b5563' }}>
                                  {category.category_name}
                                </p>
                              </div>
                            )) : (
                              <div className="text-center py-4 text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                                No categories available
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    break;
                }
              });

              return sections;
            })()}

            {/* Dynamic Content Sections */}
            {config.dynamicContent?.enabled && config.dynamicContent.sections && (
              <div className="px-4 mb-4 space-y-4">
                {config.dynamicContent.sections.map((section, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }}
                  >
                    <h4 className="font-semibold mb-2" style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                      {section.title}
                    </h4>
                    <p className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                      {section.type} content
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary Bar */}
            <div className="px-4 py-3 mb-2" style={{ backgroundColor: primaryColorCss }}>
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-semibold">1 item</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold">₹209</span>
                  <span className="text-sm">→</span>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div
              className="h-16 flex items-center justify-around border-t"
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e5e7eb',
              }}
            >
              {['Menu', 'Search', 'Orders', 'Profile'].map((item) => (
                <div
                  key={item}
                  className="flex flex-col items-center"
                  style={{ color: item === 'Menu' ? primaryColorCss : isDarkMode ? '#94a3b8' : '#6b7280' }}
                >
                  <span className="text-lg">{item === 'Menu' ? '🍽️' : item === 'Search' ? '🔍' : item === 'Orders' ? '📦' : '👤'}</span>
                  <span className="text-xs mt-0.5 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
