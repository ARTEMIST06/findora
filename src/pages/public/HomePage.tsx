import React from 'react';
import { Helmet } from 'react-helmet-async';
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
      <Helmet>
        <title>Findora - Compare Prices & Buy Smarter</title>
        <meta name="description" content="Stop hopping between tabs. Findora compares verified prices, coupons, and historical price drops across Amazon, Flipkart, Croma, and Reliance Digital in one instant search." />
        <meta property="og:title" content="Findora - Compare Prices & Buy Smarter" />
        <meta property="og:description" content="Findora compares verified prices, coupons, and historical price drops across multiple stores." />
      </Helmet>
      <HeroSection onNavigate={onNavigate} />
      <PopularCategories onNavigate={onNavigate} />
      <TrendingProducts onNavigate={onNavigate} />
      <BestDealsSection onNavigate={onNavigate} />
      <ComparisonHighlight onNavigate={onNavigate} />
      <WhyFindoraSection />
    </div>
  );
};
