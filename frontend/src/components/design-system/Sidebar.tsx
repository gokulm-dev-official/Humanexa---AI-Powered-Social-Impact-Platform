import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    PieChart,
    ShieldCheck
} from 'lucide-react';

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

interface SidebarProps {
    items: SidebarItem[];
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
}

export const Sidebar = ({ items, user }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
                {!isCollapsed && (
                    <span className="font-heading font-bold text-xl tracking-tight text-primary-text animate-fade-in">
                        HUMANEXA
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-secondary-text transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-gradient-to-r from-sapphire/10 to-transparent text-sapphire font-medium border-l-2 border-sapphire"
                                : "text-secondary-text hover:bg-gray-50 hover:text-primary-text border-l-2 border-transparent"
                        )}
                    >
                        <item.icon size={22} className="shrink-0 transition-transform group-hover:scale-110" />
                        {!isCollapsed && (
                            <span className="truncate animate-fade-in">{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-50">
                <div className={cn(
                    "flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer",
                    isCollapsed && "justify-center"
                )}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <Users size={18} className="text-gray-400" />
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden animate-fade-in">
                            <p className="text-sm font-semibold text-primary-text truncate">{user?.name || 'User Name'}</p>
                            <p className="text-xs text-secondary-text truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                    )}

                    {!isCollapsed && (
                        <LogOut size={18} className="text-gray-400 hover:text-crimson transition-colors" />
                    )}
                </div>
            </div>
        </aside>
    );
};
