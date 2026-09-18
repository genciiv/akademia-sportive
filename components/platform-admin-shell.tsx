"use client";

import { useState } from "react";

import { PlatformAdminSidebar } from "./platform-admin-sidebar";
import { PlatformAdminTopbar } from "./platform-admin-topbar";

export function PlatformAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-0 lg:p-7">
      <div className="mx-auto flex min-h-screen max-w-[1560px] overflow-hidden bg-white shadow-soft lg:min-h-[calc(100vh-56px)] lg:rounded-[24px]">
        <div className="hidden lg:block">
          <PlatformAdminSidebar />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/35"
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <div className="relative z-10 h-full">
              <PlatformAdminSidebar
                mobile
                onClose={() =>
                  setMobileOpen(false)
                }
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 bg-[#f7f8fb]">
          <PlatformAdminTopbar
            onMenu={() =>
              setMobileOpen(true)
            }
          />

          <main className="p-4 sm:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}