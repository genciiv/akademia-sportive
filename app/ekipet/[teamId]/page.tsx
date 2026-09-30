import TeamDetailClient from "@/components/ekipet/team-detail-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function TeamPage({
  params,
}: {
  params: Promise<{
    teamId: string;
  }>;
}) {
  await merrAkademineAktive();

  const { teamId } =
    await params;

  return (
    <TeamDetailClient
      teamId={teamId}
    />
  );
}