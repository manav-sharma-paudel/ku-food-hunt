import { Compass, Home, Map } from 'lucide-react';

export const PRIMARY_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Compass, end: false },
  { to: '/map', label: 'Map', icon: Map, end: false },
] as const;

export const SECONDARY_LINKS = [{ to: '/about', label: 'About' }] as const;
