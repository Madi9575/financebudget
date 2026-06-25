import React from 'react';
import {
  ShoppingCart, FileText, Utensils, Car, Gamepad2, Heart,
  Briefcase, Palette, Zap, Wifi, Droplets, Tv, Award,
  Plane, Shield, TrendingUp, DollarSign, CreditCard, Home,
  PiggyBank, Target, Gift, BookOpen, Music, Coffee, Smartphone
} from 'lucide-react';

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'utensils': Utensils,
  'car': Car,
  'gamepad-2': Gamepad2,
  'heart': Heart,
  'briefcase': Briefcase,
  'palette': Palette,
  'zap': Zap,
  'wifi': Wifi,
  'droplets': Droplets,
  'tv': Tv,
  'award': Award,
  'plane': Plane,
  'shield': Shield,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'home': Home,
  'piggy-bank': PiggyBank,
  'target': Target,
  'gift': Gift,
  'book-open': BookOpen,
  'music': Music,
  'coffee': Coffee,
  'smartphone': Smartphone,
};

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export default function IconRenderer({ name, size = 20, className = '' }: IconRendererProps) {
  const Icon = iconMap[name];
  if (!Icon) {
    // If name is an emoji, return it as a span
    return <span style={{ fontSize: `${size}px` }} className={className}>{name}</span>;
  }
  return <Icon size={size} className={className} />;
}
