import { Category, Product, Store, PriceOffer, User } from '../types';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-amazon',
    name: 'Amazon India',
    slug: 'amazon',
    logo: 'https://images.unsplash.com/photo-1523474255658-4af61b1614ff?w=120&auto=format&fit=crop&q=80',
    website: 'https://www.amazon.in',
    affiliateNetwork: 'Amazon Associates',
    affiliateTag: 'arya0611-21',
    isActive: true,
    color: '#FF9900',
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-smartphones',
    slug: 'smartphones',
    name: 'Smartphones',
    icon: 'Smartphone',
    description: 'Compare latest 5G flagships, foldables, and value kings across major retailers.',
    popularBrands: ['Apple', 'Samsung', 'OnePlus', 'Google Pixel', 'Xiaomi'],
  },
  {
    id: 'cat-laptops',
    slug: 'laptops',
    name: 'Laptops & MacBooks',
    icon: 'Laptop',
    description: 'Ultrabooks, M3/M4 MacBooks, creator workstations, and gaming rigs.',
    popularBrands: ['Apple', 'ASUS', 'Dell', 'Lenovo', 'HP'],
  },
  {
    id: 'cat-audio',
    slug: 'audio',
    name: 'Headphones & TWS',
    icon: 'Headphones',
    description: 'Active Noise Cancelling over-ears, studio monitors, and true wireless earbuds.',
    popularBrands: ['Sony', 'Apple', 'Bose', 'Sennheiser', 'Marshall'],
  },
  {
    id: 'cat-wearables',
    slug: 'smartwatches',
    name: 'Smartwatches',
    icon: 'Watch',
    description: 'ECG, cellular smartwatches, fitness bands, and GPS running watches.',
    popularBrands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit'],
  },
  {
    id: 'cat-tvs',
    slug: 'televisions',
    name: 'Smart TVs & OLEDs',
    icon: 'Tv',
    description: '4K OLED, QLED, and Mini-LED displays with HDMI 2.1 gaming support.',
    popularBrands: ['LG', 'Sony', 'Samsung', 'TCL'],
  },
  {
    id: 'cat-tablets',
    slug: 'tablets',
    name: 'Tablets & iPads',
    icon: 'Tablet',
    description: 'Pro productivity tablets, OLED entertainment screens, and e-readers.',
    popularBrands: ['Apple', 'Samsung', 'Lenovo', 'OnePlus'],
  },
  {
    id: 'cat-gaming',
    slug: 'gaming',
    name: 'Gaming & Handhelds',
    icon: 'Gamepad2',
    description: 'Next-gen consoles, VR headsets, and portable PC gaming handhelds.',
    popularBrands: ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Valve', 'ASUS ROG'],
  },
  {
    id: 'cat-cameras',
    slug: 'cameras',
    name: 'Cameras & Vlogging',
    icon: 'Camera',
    description: 'Mirrorless full-frame cameras, compact cinema shooters, and gimbal cameras.',
    popularBrands: ['Sony', 'Canon', 'Fujifilm', 'DJI'],
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PRICE_OFFERS: PriceOffer[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@findora.com',
    name: 'Arya Singh (Admin)',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-editor',
    email: 'editor@findora.com',
    name: 'Priya Sharma (Editor)',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'user-shopper',
    email: 'shopper@findora.com',
    name: 'Rahul Mehta (Shopper)',
    role: 'shopper',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-05-10T00:00:00Z',
  },
];

export const INITIAL_PRICE_HISTORY: Record<string, { date: string; price: number; storeName: string }[]> = {};