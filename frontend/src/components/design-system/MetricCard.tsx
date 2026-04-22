import React from 'react';
import { Card, CardContent } from './Card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
    title: string;
    value: string;
    trend?: {
        value: string;
        isPositive: boolean;
        isNeutral?: boolean;
    };
    icon: React.ReactNode;
    trendLabel?: string;
    loading?: boolean;
}

export const MetricCard = ({ title, value, trend, icon, trendLabel, loading }: MetricCardProps) => {
    return (
        <Card className="relative overflow-hidden group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-sapphire/5 text-sapphire group-hover:bg-sapphire/10 transition-colors">
                        {icon}
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            trend.isNeutral
                                ? "bg-gray-100 text-gray-600"
                                : trend.isPositive
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-600"
                        )}>
                            {trend.isNeutral ? <Minus size={12} /> : trend.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {trend.value}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-secondary-text">{title}</h3>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
                    ) : (
                        <div className="text-3xl font-bold text-primary-text tracking-tight animate-fade-in">
                            {value}
                        </div>
                    )}
                    {trendLabel && (
                        <p className="text-xs text-gray-400 mt-2">{trendLabel}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
