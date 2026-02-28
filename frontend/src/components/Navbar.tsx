"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, LayoutDashboard, Upload, Sparkles } from "lucide-react";

const navItems = [
  { href: "/", label: "Create", icon: Upload },
  { href: "/dashboard", label: "Vault", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:border-primary/50 transition-all shadow-lg shadow-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none">V-Sticker</span>
            <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase opacity-60">AR Engine</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isActive
                    ? "text-primary shadow-2xl shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
