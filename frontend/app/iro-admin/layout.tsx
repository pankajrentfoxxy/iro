'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Megaphone,
  Image,
  IndianRupee,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import IROLogo from '@/components/ui/IROLogo';
import ThemeToggle from '@/components/theme/ThemeToggle';

const navItems = [
  { href: '/iro-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/iro-admin/members', label: 'Members', icon: Users },
  { href: '/iro-admin/registrations', label: 'Registrations', icon: UserPlus },
  { href: '/iro-admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/iro-admin/cms', label: 'Media / CMS', icon: Image },
  { href: '/iro-admin/donations', label: 'Donations', icon: IndianRupee },
  { href: '/iro-admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/iro-admin/settings', label: 'Settings', icon: Settings },
];

export default function IroAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-card border-r border-border fixed h-full overflow-y-auto flex flex-col shadow-card">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <IROLogo variant="light" size={32} showText={false} />
          <span className="text-primary font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 px-2 py-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/iro-admin' ? pathname === '/iro-admin' : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition ${
                  isActive
                    ? 'bg-secondary/10 text-secondary font-medium border border-secondary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm truncate">Admin User</p>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 bg-background min-h-screen flex-1 p-8">{children}</main>
    </div>
  );
}
