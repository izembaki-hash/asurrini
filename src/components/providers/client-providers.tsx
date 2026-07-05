"use client";

import type { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { AdminProvider } from "@/hooks/use-admin";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
