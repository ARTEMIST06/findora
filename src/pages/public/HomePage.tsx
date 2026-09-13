import React from 'react';
import { SEOHead } from '../../components/common/SEOHead';
import { HeroSection } from '../../components/public/HeroSection';
import { PopularCategories } from '../../components/public/PopularCategories';
import { TrendingProducts } from '../../components/public/TrendingProducts';
import { BestDealsSection } from '../../components/public/BestDealsSection';
import { WhyFindoraSection } from '../../components/public/WhyFindoraSection';
import { ComparisonHighlight } from '../../components/public/ComparisonHighlight';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      <SEOHead 
        title="Findora - Compare Prices & Buy Smarter"
        description="Stop hopping between tabs. Findora compares verified prices, coupons, and historical price drops across Amazon, Flipkart, Croma, and Reliance Digital in one instant search."
      />
      <HeroSection onNavigate={onNavigate} />
      <PopularCategories onNavigate={onNavigate} />
      <TrendingProducts onNavigate={onNavigate} />
      <BestDealsSection onNavigate={onNavigate} />
      <ComparisonHighlight onNavigate={onNavigate} />
      <WhyFindoraSection />
    </div>
  );
};
