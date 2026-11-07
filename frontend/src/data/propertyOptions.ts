import { Building2, Castle, House, Landmark, Sofa } from 'lucide-react';

export const propertyOptions = [
    { value: 'apartment' as const, icon: Building2, labelKey: 'apt' as const, color: 'text-sky-500' },
    { value: 'house' as const, icon: House, labelKey: 'house' as const, color: 'text-emerald-500' },
    { value: 'studio' as const, icon: Sofa, labelKey: 'studio' as const, color: 'text-violet-500' },
    { value: 'riad' as const, icon: Landmark, labelKey: 'riad' as const, color: 'text-amber-600' },
    { value: 'villa' as const, icon: Castle, labelKey: 'villa' as const, color: 'text-rose-500' },
];
