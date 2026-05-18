"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/roles", label: "Roles" },
  { href: "/booths", label: "Booths" },
  { href: "/surveys", label: "Surveys" },
  { href: "/tasks", label: "Tasks" },
  { href: "/analytics", label: "Analytics" },
  { href: "/network", label: "Network" },
  { href: "/notifications", label: "Notifications" },
  { href: "/audit", label: "Audit logs" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex w-56 flex-col border-r border-white/10 bg-navy-light p-4"
    >
      <div className="mb-8 font-semibold tracking-tight text-saffron">IRO Admin</div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5",
              pathname === l.href ? "bg-white/10 text-white" : "text-slate-400",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </motion.aside>
  );
}
