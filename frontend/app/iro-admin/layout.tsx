'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Image,
  IndianRupee,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import IROLogo from '@/components/ui/IROLogo';

const navItems = [
  { href: '/iro-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/iro-admin/members', label: 'Members', icon: Users },
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
    <div className="min-h-screen flex">
      {/* Left sidebar */}
      <aside className="w-64 bg-[#0D1B2A] fixed h-full overflow-y-auto flex flex-col">
        <div className="p-4 flex items-center gap-2">
          <IROLogo variant="light" size={32} showText={false} />
          <span className="text-[#E8892C] font-semibold text-sm">Admin Panel</span>
        </div>
        <div className="border-t border-white/10 my-2" />
        <nav className="flex-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/iro-admin'
                ? pathname === '/iro-admin'
                : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-[#E8892C]/20 text-[#E8892C] border-l-2 border-[#E8892C]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-white/70 text-sm truncate">Admin User</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-2 text-white/70 hover:text-white text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="ml-64 bg-gray-50 min-h-screen flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
