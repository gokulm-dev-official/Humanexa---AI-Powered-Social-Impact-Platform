import React, { ReactNode } from 'react';
import { Sidebar } from '../components/design-system/Sidebar';
import { LayoutDashboard, Users, ShieldCheck, PieChart, Settings, Award } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
    userRole?: 'donor' | 'helper' | 'admin';
}

export const DashboardLayout = ({ children, userRole = 'donor' }: DashboardLayoutProps) => {

    const getNavItems = (role: string) => {
        const common = [
            { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
            { icon: Settings, label: 'Settings', path: '/settings' },
        ];

        if (role === 'admin') {
            return [
                { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
                { icon: ShieldCheck, label: 'Verification', path: '/admin/verification' },
                { icon: Users, label: 'Users', path: '/admin/users' },
                { icon: PieChart, label: 'Analytics', path: '/admin/analytics' },
                ...common
            ];
        }

        if (role === 'helper') {
            return [
                { icon: LayoutDashboard, label: 'My Dashboard', path: '/helper/dashboard' },
                { icon: Award, label: 'Achievements', path: '/helper/achievements' },
                // Add more helper links
                ...common
            ];
        }

        // Default Donor
        return [
            { icon: LayoutDashboard, label: 'My Impact', path: '/donor/dashboard' },
            { icon: Users, label: 'Beneficiaries', path: '/donor/beneficiaries' },
            ...common
        ];
    };

    const navItems = getNavItems(userRole);

    return (
        <div className="flex min-h-screen bg-background text-primary-text font-sans">
            <Sidebar items={navItems} />

            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <header className="h-20 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
                    <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
                    {/* Add header actions here (Search, Notifications) */}
                </header>

                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
