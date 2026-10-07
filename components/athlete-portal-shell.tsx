"use client";

import {
  useState,
} from "react";

import { AthletePortalNav } from "@/components/athlete-portal-nav";
import { AthletePortalTopbar } from "@/components/athlete-portal-topbar";

type Props = {
  children: React.ReactNode;
  athleteName: string;
  academyName: string;
};

export function AthletePortalShell({
  children,
  athleteName,
  academyName,
}: Props) {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-0 lg:p-7">
      <div className="mx-auto flex min-h-screen max-w-[1560px] overflow-hidden bg-white shadow-soft lg:min-h-[calc(100vh-56px)] lg:rounded-[24px]">
        <div className="hidden lg:block">
          <AthletePortalNav
            athleteName={
              athleteName
            }
            academyName={
              academyName
            }
          />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/35"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
            />

            <div className="relative z-10 h-full">
              <AthletePortalNav
                athleteName={
                  athleteName
                }
                academyName={
                  academyName
                }
                mobile
                onClose={() =>
                  setMobileOpen(
                    false
                  )
                }
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 bg-[#f7f8fb]">
          <AthletePortalTopbar
            athleteName={
              athleteName
            }
            academyName={
              academyName
            }
            onMenu={() =>
              setMobileOpen(
                true
              )
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