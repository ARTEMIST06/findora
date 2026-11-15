import React from 'react';
import { SEOHead } from '../../components/common/SEOHead';
import { HeroSection } from '../../components/public/HeroSection';
import { LiveEngine } from '../../components/public/LiveEngine';
import { PopularCategories } from '../../components/public/PopularCategories';
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
      {/* Spotlight — curated carousel, now its own section (it used to be
          the hero's right column). */}
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <LiveEngine onNavigate={onNavigate} />
      </section>
      <PopularCategories onNavigate={onNavigate} />
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
