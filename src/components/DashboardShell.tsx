'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, 
  Menu, 
  X, 
  Bell, 
  LogOut, 
  User, 
  Settings, 
  ShieldAlert, 
  Calendar, 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  FolderHeart,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import axios from 'axios';

type ShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
};

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// Turns a createdAt timestamp into "Just now" / "10m ago" / "1h ago" / "2d ago"
function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function DashboardShell({ children, user }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Toggle Dark Mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Fetch real notifications from the API
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh periodically so "Just now" ages into "5m ago" etc.
    // and so new real events show up without a full page reload.
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [user.role]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Define Navigation Items based on Role
  const navItemsByRole: Record<string, Array<{ label: string; href: string; icon: React.ReactNode }>> = {
    ADMIN: [
      { label: 'Analytics Dashboard', href: '/dashboard/admin', icon: <TrendingUp className="h-4 w-4" /> },
      { label: 'Doctor Roster', href: '/dashboard/admin/doctors', icon: <Users className="h-4 w-4" /> },
      { label: 'Patient Directory', href: '/dashboard/admin/patients', icon: <FolderHeart className="h-4 w-4" /> },
      { label: 'System Audit Logs', href: '/dashboard/admin/audit-logs', icon: <ShieldAlert className="h-4 w-4" /> },
      { label: 'System Settings', href: '/dashboard/admin/settings', icon: <Settings className="h-4 w-4" /> },
    ],
    DOCTOR: [
      { label: 'Clinical Dashboard', href: '/dashboard/doctor', icon: <Activity className="h-4 w-4" /> },
      { label: 'My Appointments', href: '/dashboard/doctor/appointments', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Patient Records', href: '/dashboard/doctor/patients', icon: <FolderHeart className="h-4 w-4" /> },
      { label: 'Prescription Writer', href: '/dashboard/doctor/prescriptions', icon: <FileText className="h-4 w-4" /> },
    ],
    RECEPTIONIST: [
      { label: 'Intake Dashboard', href: '/dashboard/receptionist', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Manage Patients', href: '/dashboard/receptionist/patients', icon: <Users className="h-4 w-4" /> },
      { label: 'Billing & Invoices', href: '/dashboard/receptionist/billing', icon: <CreditCard className="h-4 w-4" /> },
    ],
    PATIENT: [
      { label: 'My Health Summary', href: '/dashboard/patient', icon: <FolderHeart className="h-4 w-4" /> },
      { label: 'My Appointments', href: '/dashboard/patient/appointments', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Prescriptions List', href: '/dashboard/patient/prescriptions', icon: <FileText className="h-4 w-4" /> },
      { label: 'Billing & Invoices', href: '/dashboard/patient/billing', icon: <CreditCard className="h-4 w-4" /> },
    ],
  };

  const navItems = navItemsByRole[user.role] || [];

  const markAllRead = async () => {
    // Optimistic UI update first, so the badge clears instantly
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await axios.post('/api/notifications/mark-read');
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
      // Revert on failure by re-fetching real state
      fetchNotifications();
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header Brand */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2">
        <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          MediVault
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          {user.role} workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile Card Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-300">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Static Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-filter backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-base font-bold text-slate-600 dark:text-slate-400 hidden sm:block">
              Medical Center Platform
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) fetchNotifications(); // refresh right as it opens
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Box */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 p-4 animate-in fade-in-50 slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs transition-colors ${n.isRead ? 'opacity-60' : 'bg-emerald-500/5 dark:bg-emerald-400/5'}`}>
                        <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-slate-500 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Badge */}
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 rounded-full">
              {user.role}
            </span>
          </div>
        </header>

        {/* Dynamic Page Content Injector */}
        <main className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop mask */}
          <div 
            onClick={() => setMobileOpen(false)} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          {/* Drawer sheet */}
          <div className="fixed inset-y-0 left-0 w-64 z-50 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
