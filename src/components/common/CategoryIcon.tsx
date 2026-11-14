import React from 'react';
import {
  Monitor,
  Home,
  CookingPot,
  Shirt,
  Sparkles,
  Smartphone,
  Watch,
  Headphones,
  Laptop,
  BatteryCharging,
  Footprints,
  Gem,
  Leaf,
  Dumbbell,
  Luggage,
  Camera,
  Tag,
} from 'lucide-react';

/** Shared category icon picker (keyword match on the normalised key). */
export function categoryIconFor(key: string): React.ComponentType<{ className?: string }> {
  const k = key;
  if (k.includes('earbud') || k.includes('audio') || k.includes('headphone')) return Headphones;
  if (k.includes('smartphone') || k.includes('mobile')) return Smartphone;
  if (k.includes('watch')) return Watch;
  if (k.includes('laptop')) return Laptop;
  if (k.includes('powerbank') || k.includes('battery')) return BatteryCharging;
  if (k.includes('kitchen')) return CookingPot;
  if (k.includes('appliance')) return Home;
  if (k.includes('fashion') || k.includes('shirt') || k.includes('kurta') || k.includes('jeans') || k.includes('trouser')) return Shirt;
  if (k.includes('footwear') || k.includes('shoe') || k.includes('sneaker') || k.includes('boot') || k.includes('sandal') || k.includes('heel') || k.includes('loafer')) return Footprints;
  if (k.includes('beauty') || k.includes('skincare') || k.includes('makeup')) return Sparkles;
  if (k.includes('jewell') || k.includes('jewel')) return Gem;
  if (k.includes('garden')) return Leaf;
  if (k.includes('fitness') || k.includes('gym')) return Dumbbell;
  if (k.includes('bag') || k.includes('backpack') || k.includes('trolley') || k.includes('travel')) return Luggage;
  if (k.includes('camera')) return Camera;
  if (k.includes('home') || k.includes('decor') || k.includes('furniture')) return Home;
  if (k.includes('electronic')) return Monitor;
  return Tag;
}

export const CategoryIcon: React.FC<{ categoryKey: string; className?: string }> = ({
  categoryKey,
  className = 'w-7 h-7',
}) => {
  const Icon = categoryIconFor(categoryKey);
  return <Icon className={className} />;
};
