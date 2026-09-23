import Link from "next/link";
import { redirect } from "next/navigation";

import { AthletePortalNav } from "@/components/athlete-portal-nav";
import { requireAthleteAccess } from "@/lib/athlete-access";

export default async function AthletePortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje?next=/sportist/dashboard");
    }

    redirect("/");
  }

  const athleteName =
    `${access.player.firstName} ${access.player.lastName}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/sportist/dashboard"
              className="text-lg font-semibold tracking-tight"
            >
              Portali i Sportistit
            </Link>

            <p className="mt-1 text-sm text-slate-500">
              {access.academy.name}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {athleteName}
            </p>

            <p className="text-xs text-slate-500">
              Sportist
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <AthletePortalNav
          athleteName={athleteName}
          academyName={access.academy.name}
        />

        <main>{children}</main>
      </div>
    </div>
  );
}