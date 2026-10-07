'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, RotateCcw, Gamepad2, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function MobileNav() {
  const pathname = usePathname();
  const { dueForReviewWords } = useApp();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    {
      href: '/review',
      label: 'Review',
      icon: RotateCcw,
      badge: dueForReviewWords.length > 0 ? dueForReviewWords.length : undefined,
    },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-30 px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => sound.playTap()}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl relative transition-all ${
                isActive
                  ? 'text-emerald-500 font-semibold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{link.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
