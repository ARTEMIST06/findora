import React from 'react';
import { SEOHead } from '../../components/common/SEOHead';
import { HeroSection } from '../../components/public/HeroSection';
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
    <div className="space-y-4 pb-12">
      <SEOHead 
        title="Findora — Find It. Compare It. Buy Smarter."
        description="Find products, check verified Amazon India prices, discover better deals, and buy smarter with Findora."
        canonicalPath="/"
        isHomePage={true}
      />
      <HeroSection onNavigate={onNavigate} />
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
