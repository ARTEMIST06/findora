import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface RealOfferData {
  price: number;
  originalPrice?: number;
  currency?: string;
  availability?: string;
  storeName?: string;
  productUrl?: string;
}

export interface RealProductSEOData {
  name: string;
  description?: string;
  images?: string[];
  brand?: string;
  category?: string;
  id?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  offers?: RealOfferData[];
}

export interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  canonicalPath?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  productData?: RealProductSEOData;
  isHomePage?: boolean;
}

const DEFAULT_TITLE = 'Findora — Find It. Compare It. Buy Smarter.';
const DEFAULT_DESCRIPTION = 'Find products, compare prices across stores, discover better deals, and buy smarter with Findora.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1200&auto=format&fit=crop';
const SITE_NAME = 'Findora';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image = DEFAULT_IMAGE,
  url,
  canonicalPath,
  type = 'website',
  noIndex = false,
  breadcrumbs,
  jsonLd,
  productData,
  isHomePage = false,
}) => {
  // 1. Title formatting
  const fullTitle = useMemo(() => {
    if (!title || title.trim() === '') return DEFAULT_TITLE;
    const trimmed = title.trim();
    if (trimmed === DEFAULT_TITLE) return DEFAULT_TITLE;
    if (trimmed.toLowerCase().includes(SITE_NAME.toLowerCase())) return trimmed;
    return `${trimmed} | ${SITE_NAME}`;
  }, [title]);

  // 2. Description formatting
  const cleanDescription = useMemo(() => {
    if (!description || description.trim() === '') return DEFAULT_DESCRIPTION;
    return description.trim();
  }, [description]);

  // 3. Resolve canonical URL cleanly
  const canonicalUrl = useMemo(() => {
    if (url && url.startsWith('http')) {
      try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
      } catch {
        return url.split('?')[0].split('#')[0];
      }
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://findora.in';

    if (canonicalPath) {
      const clean = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
      return `${origin}${clean}`;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      const pathPart = (hash ? hash : window.location.pathname).split('?')[0];
      const clean = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
      return `${origin}${clean === '' ? '/' : clean}`;
    }

    return `${origin}/`;
  }, [url, canonicalPath]);

  // 4. Absolute Image URL
  const fullImageUrl = useMemo(() => {
    if (!image) return DEFAULT_IMAGE;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://findora.in';
    return `${origin}${image.startsWith('/') ? image : `/${image}`}`;
  }, [image]);

  // 5. Search Console Verification
  const gscVerification = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || '')
    : '';

  // 6. JSON-LD Structured Data Builder
  const structuredDataList = useMemo(() => {
    const list: Record<string, any>[] = [];
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://findora.in';

    // A. WebSite & Organization Schema (rendered on Home or when isHomePage=true)
    if (isHomePage) {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_NAME,
        'alternateName': 'Findora Price Comparison & Product Discovery',
        'url': origin,
        'description': DEFAULT_DESCRIPTION,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${origin}/#/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      });

      list.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': SITE_NAME,
        'url': origin,
        'logo': `${origin}/favicon.svg`,
        'description': DEFAULT_DESCRIPTION,
      });
    }

    // B. Product Schema (strictly matching actual Firestore fields)
    if (productData) {
      const schemaProduct: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': productData.name,
      };

      if (productData.description) {
        schemaProduct.description = productData.description;
      }

      if (productData.images && productData.images.length > 0) {
        schemaProduct.image = productData.images;
      } else if (image) {
        schemaProduct.image = [fullImageUrl];
      }

      if (productData.brand) {
        schemaProduct.brand = {
          '@type': 'Brand',
          'name': productData.brand,
        };
      }

      if (productData.category) {
        schemaProduct.category = productData.category;
      }

      if (productData.sku || productData.id) {
        schemaProduct.sku = productData.sku || productData.id;
      }

      // AggregateRating: ONLY if real rating and reviewCount exist (> 0)
      if (
        typeof productData.rating === 'number' &&
        productData.rating > 0 &&
        typeof productData.reviewCount === 'number' &&
        productData.reviewCount > 0
      ) {
        schemaProduct.aggregateRating = {
          '@type': 'AggregateRating',
          'ratingValue': productData.rating,
          'reviewCount': productData.reviewCount,
          'bestRating': 5,
          'worstRating': 1,
        };
      }

      // Offers: only if real price > 0 exists
      const validOffers = (productData.offers || []).filter(
        (o) => typeof o.price === 'number' && o.price > 0
      );

      if (validOffers.length === 1) {
        const o = validOffers[0];
        schemaProduct.offers = {
          '@type': 'Offer',
          'price': o.price,
          'priceCurrency': o.currency || 'INR',
          'availability': o.availability === 'out_of_stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          'url': canonicalUrl,
          ...(o.storeName ? { 'seller': { '@type': 'Organization', 'name': o.storeName } } : {}),
        };
      } else if (validOffers.length > 1) {
        const prices = validOffers.map((o) => o.price);
        schemaProduct.offers = {
          '@type': 'AggregateOffer',
          'lowPrice': Math.min(...prices),
          'highPrice': Math.max(...prices),
          'priceCurrency': validOffers[0].currency || 'INR',
          'offerCount': validOffers.length,
          'offers': validOffers.map((o) => ({
            '@type': 'Offer',
            'price': o.price,
            'priceCurrency': o.currency || 'INR',
            'availability': o.availability === 'out_of_stock'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            'url': canonicalUrl,
            ...(o.storeName ? { 'seller': { '@type': 'Organization', 'name': o.storeName } } : {}),
          })),
        };
      }

      list.push(schemaProduct);
    }

    // C. BreadcrumbList Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((b, idx) => {
          const itemUrl = b.url.startsWith('http')
            ? b.url
            : `${origin}${b.url.startsWith('/') ? b.url : `/${b.url}`}`;
          return {
            '@type': 'ListItem',
            'position': idx + 1,
            'name': b.name,
            'item': itemUrl,
          };
        }),
      });
    }

    // D. Additional custom JSON-LD
    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        list.push(...jsonLd);
      } else {
        list.push(jsonLd);
      }
    }

    return list;
  }, [isHomePage, productData, breadcrumbs, jsonLd, canonicalUrl, fullImageUrl, image]);

  return (
    <Helmet>
      {/* 1. Document Title & Meta Description */}
      <title>{fullTitle}</title>
      <meta name="description" content={cleanDescription} />

      {/* 2. Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* 3. Robots Directives */}
      {noIndex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow" />
        </>
      )}

      {/* 4. Open Graph / Social Sharing */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_IN" />

      {/* 5. Twitter / X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={cleanDescription} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* 6. Google Search Console Verification (when token provided) */}
      {gscVerification && (
        <meta name="google-site-verification" content={gscVerification} />
      )}

      {/* 7. Structured Data (JSON-LD) */}
      {structuredDataList.map((item, idx) => (
        <script key={`jsonld-${idx}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};
