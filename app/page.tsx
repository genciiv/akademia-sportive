import { Dashboard } from "@/components/dashboard";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  const {
    session,
    membership,
    academy,
  } = await merrAkademineAktive();

  return (
    <Dashboard
      academyName={academy.name}
      userName={session.user.name}
      role={membership.role}
    />
  );
}