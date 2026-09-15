import { redirect } from "next/navigation";

import ReportsClient from "@/components/raportet/reports-client";
import { merrAkademineAktive } from "@/lib/academy-context";
import {
  hasAnyPermission,
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const { membership } =
    await merrAkademineAktive();

  const canViewReports =
    hasAnyPermission(
      String(membership.role),
      [
        PERMISSIONS.REPORTS_SPORTS_VIEW,
        PERMISSIONS.REPORTS_FINANCE_VIEW,
      ]
    );

  if (!canViewReports) {
    redirect("/");
  }

  return <ReportsClient />;
}
