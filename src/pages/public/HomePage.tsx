import React from 'react';
import { SEOHead } from '../../components/common/SEOHead';
import { HeroSection } from '../../components/public/HeroSection';
import { CategoryShowcase } from '../../components/public/CategoryShowcase';
import { TrendingProducts } from '../../components/public/TrendingProducts';
import { StoreBannerStrip } from '../../components/public/StoreBannerStrip';
import { BestDealsSection } from '../../components/public/BestDealsSection';
import { EditorialBanners } from '../../components/public/EditorialBanners';
import { WhyFindoraSection } from '../../components/public/WhyFindoraSection';
import { ComparisonHighlight } from '../../components/public/ComparisonHighlight';
import { RecentlyAdded } from '../../components/public/RecentlyAdded';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div>
      {/* Sections carry their own vertical padding. */}
      <SEOHead
        title="Findora — We Search. You Shop."
        description="We search, you shop — Findora finds verified products on Amazon India with checked prices and real deals."
        canonicalPath="/"
        isHomePage={true}
      />
      <HeroSection onNavigate={onNavigate} />
      {/* Big categories sit right below the hero now (Amazon-style cards
          with real products inside). The Spotlight carousel (LiveEngine)
          and the small PopularCategories chip row were removed — the
          homepage stays clean and the categories carry the top. */}
      <CategoryShowcase onNavigate={onNavigate} />
      <TrendingProducts onNavigate={onNavigate} />
      <StoreBannerStrip onNavigate={onNavigate} />
      <BestDealsSection onNavigate={onNavigate} />
      <EditorialBanners onNavigate={onNavigate} />
      <ComparisonHighlight onNavigate={onNavigate} />
      <RecentlyAdded onNavigate={onNavigate} />
      <WhyFindoraSection />
    </div>
  );
};
