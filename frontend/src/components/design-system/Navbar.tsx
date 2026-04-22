import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Menu, X, Bell, Heart, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const appleSpring = { type: 'spring', damping: 30, stiffness: 400 } as any;
const appleFade = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } as any;

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, isDonor, isHelper } = useAuth();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsNotifOpen(false);
        setShowProfileDropdown(false);
    }, [location.pathname]);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', auth: true },
        { name: 'Live Impact', path: '/live-impact', auth: true },
        { name: 'Discovery', path: '/discovery', auth: true },
        { name: 'Certificates', path: '/certificates', auth: true },
        { name: 'Profile', path: '/profile', auth: true },
    ];

    const publicLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '#vision' },
        { name: 'How It Works', path: '#protocol' },
    ];

    const activeLinks = isAuthenticated ? navLinks : publicLinks;

    const getRoleLabel = () => {
        if (isDonor) return 'Donor';
        if (isHelper) return 'Helper';
        return 'Member';
    };

    const profileMenuItems = [
        { icon: '👤', label: 'My Profile', path: '/profile' },
        { icon: isDonor ? '💰' : '📊', label: isDonor ? 'Donation History' : 'My Earnings', path: isDonor ? '/donation-history' : '/profile' },
        { icon: '💬', label: 'Messages', path: '/live-impact' },
        { icon: '📜', label: 'Certificates', path: '/certificates' },
        { icon: '⚙️', label: 'Settings', path: '/profile' },
        { icon: '❓', label: 'Help & Support', path: '/dashboard' },
    ];

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple",
            isScrolled
                ? "bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-soft-xs"
                : "bg-transparent border-b border-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[52px] flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-soft-sm group-hover:shadow-soft-md transition-all duration-300 ease-apple">
                        <img src="/src/assets/logo_splash.png" alt="Social Kind" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-[17px] font-semibold text-primary-text hidden sm:block tracking-tight">
                        Social Kind
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    {activeLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={cn(
                                "relative px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ease-apple",
                                location.pathname === link.path
                                    ? "text-primary-text"
                                    : "text-secondary-text hover:text-primary-text"
                            )}
                        >
                            {link.name}
                            {location.pathname === link.path && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-black/[0.05] rounded-full -z-10"
                                    transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-2">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-1.5">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsNotifOpen(!isNotifOpen);
                                        setShowProfileDropdown(false);
                                        if (!isNotifOpen) markAllAsRead();
                                    }}
                                    className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-apple relative",
                                        isNotifOpen ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"
                                    )}
                                >
                                    <Bell size={17} className="text-primary-text/70" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[9px] font-semibold rounded-full flex items-center justify-center border-2 border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isNotifOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                                transition={appleFade}
                                                className="absolute right-0 mt-2 w-[340px] bg-white rounded-2xl shadow-soft-xl border border-black/[0.06] overflow-hidden z-50"
                                            >
                                                <div className="px-4 py-3 border-b border-black/[0.04] flex justify-between items-center">
                                                    <span className="text-[15px] font-semibold text-primary-text">Notifications</span>
                                                    <button
                                                        onClick={() => setIsNotifOpen(false)}
                                                        className="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors"
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                                <div className="max-h-[380px] overflow-y-auto">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((n) => (
                                                            <div
                                                                key={n.id}
                                                                onClick={() => {
                                                                    const helpRequestId = (n as any).metadata?.helpRequestId;
                                                                    const chatId = (n as any).metadata?.chatId;
                                                                    setIsNotifOpen(false);
                                                                    if (helpRequestId) {
                                                                        navigate(`/dashboard?donate=${helpRequestId}`);
                                                                    } else if (chatId) {
                                                                        navigate(`/live-impact?chatId=${chatId}`);
                                                                    } else {
                                                                        navigate('/dashboard');
                                                                    }
                                                                }}
                                                                className="px-4 py-3.5 hover:bg-black/[0.02] transition-colors duration-200 border-b border-black/[0.03] last:border-0 cursor-pointer group"
                                                            >
                                                                <p className="text-[13px] font-medium text-primary-text leading-snug mb-1">{n.text}</p>
                                                                <span className="text-[11px] text-secondary-text">Just now</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-12 text-center">
                                                            <div className="w-10 h-10 bg-black/[0.03] rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Bell size={18} className="text-secondary-text/40" />
                                                            </div>
                                                            <p className="text-[13px] text-secondary-text">No notifications yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider */}
                            <div className="h-5 w-px bg-black/[0.08] mx-1" />

                            {/* Profile */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(!showProfileDropdown);
                                        setIsNotifOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-black/[0.04] transition-all duration-200 ease-apple"
                                >
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-black/[0.06]">
                                        <img
                                            src={user?.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-[13px] font-medium text-primary-text hidden lg:block">
                                        {user?.profile?.fullName?.split(' ')[0] || 'User'}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {showProfileDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                                transition={appleFade}
                                                className="absolute right-0 mt-2 w-[240px] bg-white rounded-2xl shadow-soft-xl border border-black/[0.06] overflow-hidden z-50"
                                            >
                                                {/* Profile Header */}
                                                <div className="px-4 py-3.5 border-b border-black/[0.04]">
                                                    <p className="text-[15px] font-semibold text-primary-text">{user?.profile?.fullName || 'User'}</p>
                                                    <p className="text-[12px] text-accent font-medium mt-0.5">{getRoleLabel()}</p>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-1.5">
                                                    {profileMenuItems.map((item) => (
                                                        <button
                                                            key={item.label}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-primary-text/80 hover:bg-black/[0.03] transition-colors duration-150"
                                                            onClick={() => {
                                                                setShowProfileDropdown(false);
                                                                navigate(item.path);
                                                            }}
                                                        >
                                                            <span className="text-[14px]">{item.icon}</span>
                                                            <span className="font-medium">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Logout */}
                                                <div className="border-t border-black/[0.04] py-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setShowProfileDropdown(false);
                                                            setShowLogoutModal(true);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-danger hover:bg-danger/[0.04] transition-colors duration-150"
                                                    >
                                                        <LogOut size={14} />
                                                        <span className="font-medium">Log Out</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <Link to="/login">
                                <button className="h-8 px-4 rounded-full text-[13px] font-medium text-primary-text/70 hover:text-primary-text hover:bg-black/[0.04] transition-all duration-200 ease-apple">
                                    Sign In
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="h-8 px-5 rounded-full text-[13px] font-medium text-white bg-primary-text hover:bg-primary-text/90 transition-all duration-200 ease-apple">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } as any}
                        className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-black/[0.06]"
                    >
                        <div className="px-5 py-4 space-y-1">
                            {activeLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-colors duration-200",
                                        location.pathname === link.path
                                            ? "text-accent bg-accent/[0.06]"
                                            : "text-primary-text/70 hover:bg-black/[0.03]"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                    <ChevronRight size={16} className="text-secondary-text/30" />
                                </Link>
                            ))}
                        </div>
                        <div className="px-5 pb-5 pt-2 border-t border-black/[0.04] flex gap-3">
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full h-11 rounded-xl text-[15px] font-medium border border-black/[0.08] hover:bg-black/[0.02] transition-colors">
                                            Sign In
                                        </button>
                                    </Link>
                                    <Link to="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full h-11 rounded-xl text-[15px] font-medium text-white bg-primary-text transition-colors">
                                            Get Started
                                        </button>
                                    </Link>
                                </>
                            ) : (
                                <Link to="/profile" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="w-full h-11 rounded-xl text-[15px] font-medium text-white bg-accent transition-colors">
                                        My Profile
                                    </button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={appleFade}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
                            onClick={() => setShowLogoutModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={appleSpring}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white rounded-2xl shadow-soft-2xl z-[201] overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <LogOut size={22} className="text-danger" />
                                </div>
                                <h3 className="text-[17px] font-semibold text-primary-text mb-1.5">Log Out?</h3>
                                <p className="text-[13px] text-secondary-text leading-relaxed">
                                    Are you sure you want to log out of your account?
                                </p>
                            </div>
                            <div className="border-t border-black/[0.06] flex">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 h-12 text-[15px] font-medium text-accent hover:bg-black/[0.02] transition-colors border-r border-black/[0.06]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutModal(false);
                                        logout();
                                    }}
                                    className="flex-1 h-12 text-[15px] font-medium text-danger hover:bg-danger/[0.04] transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};
