import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Zap, Target, Shield, Settings, HelpCircle, LogOut, ChevronRight, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

export const ChatSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <div className="w-[80px] lg:w-[280px] h-full bg-white border-r border-gray-100 flex flex-col shrink-0 relative z-30 transition-all duration-300">
            {/* Branding */}
            <div className="h-20 flex items-center px-4 lg:px-8 shrink-0">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sapphire-start to-sapphire-end flex items-center justify-center text-white shadow-lg shadow-sapphire/20 group-hover:shadow-glow group-hover:scale-110 transition-all duration-500">
                        <Heart size={20} fill="currentColor" className="text-white/20" />
                        <span className="absolute font-black text-xl">H</span>
                    </div>
                    <span className="hidden lg:block font-serif font-black text-xl text-primary-text tracking-tighter uppercase">Humanexa</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-10 px-4 lg:px-6 space-y-2 overflow-y-auto scrollbar-hide">
                <NavItem icon={<Home size={22} />} label="Dashboard" to="/dashboard" active={location.pathname === '/dashboard'} />
                <NavItem icon={<MessageSquare size={22} />} label="Impact Registry" to="/live-impact" active={location.pathname === '/live-impact'} />
                <NavItem icon={<Zap size={22} />} label="Achievements" to="/certificates" active={location.pathname === '/certificates'} />
                <NavItem icon={<Target size={22} />} label="Goals" to="#" />
                <NavItem icon={<Shield size={22} />} label="Identity" to="/profile" active={location.pathname === '/profile'} />

                <div className="pt-10 mb-4 hidden lg:block">
                    <span className="text-[10px] font-black text-secondary-text/40 uppercase tracking-[0.2em] px-4">System Console</span>
                </div>

                <NavItem icon={<Settings size={22} />} label="Settings" to="#" />
                <NavItem icon={<HelpCircle size={22} />} label="Support" to="#" />
            </div>

            {/* Bottom Section */}
            <div className="p-4 lg:p-6 border-t border-gray-100 shrink-0">
                <button className="w-full h-12 rounded-xl flex items-center gap-4 px-4 text-secondary-text/60 hover:text-red-500 hover:bg-red-50 transition-all group overflow-hidden">
                    <div className="shrink-0 group-hover:scale-110 transition-transform">
                        <LogOut size={22} />
                    </div>
                    <span className="hidden lg:block text-sm font-bold uppercase tracking-widest whitespace-nowrap">Logout Registry</span>
                </button>
            </div>

            {/* Mobile / Tablet indicator shadow */}
            <div className="absolute top-0 bottom-0 -right-4 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none opacity-50" />
        </div>
    );
};

const NavItem = ({ icon, label, to, active }: any) => (
    <Link
        to={to}
        className={cn(
            "group relative w-full h-12 flex items-center gap-4 px-4 rounded-xl transition-all duration-300",
            active
                ? "bg-sapphire/5 text-sapphire shadow-inner ring-1 ring-sapphire/5"
                : "text-secondary-text/60 hover:bg-gray-50 hover:text-primary-text"
        )}
    >
        {active && (
            <motion.div
                layoutId="navGlow"
                className="absolute inset-0 bg-sapphire/5 rounded-xl border border-sapphire/10 shadow-glow pointer-events-none"
            />
        )}
        <div className={cn(
            "shrink-0 z-10 transition-all duration-500 group-hover:scale-110",
            active && "text-sapphire"
        )}>
            {icon}
        </div>
        <span className={cn(
            "hidden lg:block text-[13px] font-bold uppercase tracking-widest whitespace-nowrap z-10",
            active ? "text-sapphire" : "text-inherit"
        )}>
            {label}
        </span>

        {active && (
            <div className="absolute -left-1 w-1.5 h-6 bg-sapphire rounded-r-full shadow-glow" />
        )}

        {/* Tooltip for mobile */}
        <div className="lg:hidden absolute left-20 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {label}
        </div>
    </Link>
);
