'use client';

import React from 'react';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopHeader } from './TopHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { DailySessionModal } from '@/components/learning/DailySessionModal';
import { NotificationManager } from '@/components/notifications/NotificationManager';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Top Header */}
        <TopHeader />

        {/* Main Content Area */}
        <main className="lg:pl-64 xl:pl-72 min-h-screen pb-20 lg:pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />

        {/* Modals & Overlays */}
        <OnboardingModal />
        <AuthModal />
        <SettingsModal />
        <DailySessionModal />
        <NotificationManager />
      </div>
    </AppProvider>
  );
}
