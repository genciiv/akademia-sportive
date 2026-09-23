import assert from "node:assert/strict";
import test from "node:test";

import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";

import {
  join,
  relative,
} from "node:path";

type HttpMethod =
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE";

type PermissionContract = {
  path: string;
  method: HttpMethod;
  permission: string;
};

function readSource(
  relativePath: string
) {
  return readFileSync(
    join(
      process.cwd(),
      ...relativePath.split("/")
    ),
    "utf8"
  );
}

function getHandlerBlock(
  source: string,
  method: HttpMethod
) {
  const pattern =
    /export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/g;

  const matches =
    Array.from(
      source.matchAll(pattern)
    );

  const index =
    matches.findIndex(
      (match) =>
        match[1] === method
    );

  assert.notEqual(
    index,
    -1,
    `Expected ${method} handler`
  );

  const start =
    matches[index].index ?? 0;

  const end =
    index + 1 < matches.length
      ? matches[index + 1].index ??
        source.length
      : source.length;

  return source.slice(
    start,
    end
  );
}

function assertPermissionContract(
  contract: PermissionContract
) {
  const source =
    readSource(
      contract.path
    );

  const block =
    getHandlerBlock(
      source,
      contract.method
    );

  const pattern =
    new RegExp(
      `requireAcademyPermission\\(\\s*PERMISSIONS\\.${contract.permission}\\s*\\)`
    );

  assert.match(
    block,
    pattern,
    `${contract.method} ${contract.path} should require ${contract.permission}`
  );
}

const CONTRACTS:
  PermissionContract[] = [
    {
      path: "app/api/calendar/[eventId]/route.ts",
      method: "GET",
      permission: "CALENDAR_VIEW",
    },
    {
      path: "app/api/calendar/[eventId]/route.ts",
      method: "PATCH",
      permission: "CALENDAR_MANAGE",
    },
    {
      path: "app/api/calendar/[eventId]/route.ts",
      method: "DELETE",
      permission: "CALENDAR_MANAGE",
    },
    {
      path: "app/api/calendar/route.ts",
      method: "GET",
      permission: "CALENDAR_VIEW",
    },
    {
      path: "app/api/calendar/route.ts",
      method: "POST",
      permission: "CALENDAR_MANAGE",
    },

    {
      path: "app/api/coaches/[coachId]/route.ts",
      method: "PATCH",
      permission: "COACHES_UPDATE",
    },
    {
      path: "app/api/coaches/[coachId]/route.ts",
      method: "DELETE",
      permission: "COACHES_DELETE",
    },
    {
      path: "app/api/coaches/[coachId]/teams/route.ts",
      method: "GET",
      permission: "COACHES_VIEW",
    },
    {
      path: "app/api/coaches/[coachId]/teams/route.ts",
      method: "POST",
      permission: "COACH_ASSIGNMENTS_MANAGE",
    },
    {
      path: "app/api/coaches/[coachId]/teams/route.ts",
      method: "DELETE",
      permission: "COACH_ASSIGNMENTS_MANAGE",
    },
    {
      path: "app/api/coaches/route.ts",
      method: "GET",
      permission: "COACHES_VIEW",
    },
    {
      path: "app/api/coaches/route.ts",
      method: "POST",
      permission: "COACHES_CREATE",
    },

    {
      path: "app/api/drills/[drillId]/route.ts",
      method: "PATCH",
      permission: "DRILLS_UPDATE",
    },
    {
      path: "app/api/drills/[drillId]/route.ts",
      method: "DELETE",
      permission: "DRILLS_DELETE",
    },
    {
      path: "app/api/drills/route.ts",
      method: "GET",
      permission: "DRILLS_VIEW",
    },
    {
      path: "app/api/drills/route.ts",
      method: "POST",
      permission: "DRILLS_CREATE",
    },

    {
      path: "app/api/expenses/[expenseId]/route.ts",
      method: "PATCH",
      permission: "EXPENSES_MANAGE",
    },
    {
      path: "app/api/expenses/[expenseId]/route.ts",
      method: "DELETE",
      permission: "EXPENSES_MANAGE",
    },
    {
      path: "app/api/expenses/route.ts",
      method: "GET",
      permission: "EXPENSES_VIEW",
    },
    {
      path: "app/api/expenses/route.ts",
      method: "POST",
      permission: "EXPENSES_MANAGE",
    },
    {
      path: "app/api/finance/route.ts",
      method: "GET",
      permission: "FINANCE_VIEW",
    },

    {
      path: "app/api/guardians/[guardianId]/route.ts",
      method: "PATCH",
      permission: "GUARDIANS_UPDATE",
    },
    {
      path: "app/api/guardians/[guardianId]/route.ts",
      method: "DELETE",
      permission: "GUARDIANS_DELETE",
    },
    {
      path: "app/api/guardians/route.ts",
      method: "GET",
      permission: "GUARDIANS_VIEW",
    },
    {
      path: "app/api/guardians/route.ts",
      method: "POST",
      permission: "GUARDIANS_CREATE",
    },

    {
      path: "app/api/matches/[matchId]/events/route.ts",
      method: "GET",
      permission: "MATCHES_VIEW",
    },
    {
      path: "app/api/matches/[matchId]/events/route.ts",
      method: "POST",
      permission: "MATCH_EVENTS_MANAGE",
    },
    {
      path: "app/api/matches/[matchId]/events/route.ts",
      method: "PATCH",
      permission: "MATCH_EVENTS_MANAGE",
    },
    {
      path: "app/api/matches/[matchId]/events/route.ts",
      method: "DELETE",
      permission: "MATCH_EVENTS_MANAGE",
    },

    {
      path: "app/api/matches/[matchId]/performance/route.ts",
      method: "GET",
      permission: "PERFORMANCE_VIEW",
    },
    {
      path: "app/api/matches/[matchId]/performance/route.ts",
      method: "POST",
      permission: "PERFORMANCE_MANAGE",
    },
    {
      path: "app/api/matches/[matchId]/performance/route.ts",
      method: "DELETE",
      permission: "PERFORMANCE_MANAGE",
    },

    {
      path: "app/api/matches/[matchId]/players/route.ts",
      method: "GET",
      permission: "MATCHES_VIEW",
    },
    {
      path: "app/api/matches/[matchId]/players/route.ts",
      method: "POST",
      permission: "MATCH_SQUAD_MANAGE",
    },
    {
      path: "app/api/matches/[matchId]/players/route.ts",
      method: "PATCH",
      permission: "MATCH_SQUAD_MANAGE",
    },
    {
      path: "app/api/matches/[matchId]/players/route.ts",
      method: "DELETE",
      permission: "MATCH_SQUAD_MANAGE",
    },

    {
      path: "app/api/matches/[matchId]/route.ts",
      method: "GET",
      permission: "MATCHES_VIEW",
    },
    {
      path: "app/api/matches/[matchId]/route.ts",
      method: "PATCH",
      permission: "MATCHES_UPDATE",
    },
    {
      path: "app/api/matches/[matchId]/route.ts",
      method: "DELETE",
      permission: "MATCHES_DELETE",
    },
    {
      path: "app/api/matches/[matchId]/stats/route.ts",
      method: "GET",
      permission: "MATCHES_VIEW",
    },
    {
      path: "app/api/matches/route.ts",
      method: "GET",
      permission: "MATCHES_VIEW",
    },
    {
      path: "app/api/matches/route.ts",
      method: "POST",
      permission: "MATCHES_CREATE",
    },

    {
      path: "app/api/notifications/[notificationId]/route.ts",
      method: "PATCH",
      permission: "NOTIFICATIONS_MANAGE",
    },
    {
      path: "app/api/notifications/[notificationId]/route.ts",
      method: "DELETE",
      permission: "NOTIFICATIONS_MANAGE",
    },
    {
      path: "app/api/notifications/route.ts",
      method: "GET",
      permission: "NOTIFICATIONS_VIEW",
    },
    {
      path: "app/api/notifications/route.ts",
      method: "POST",
      permission: "NOTIFICATIONS_MANAGE",
    },

    {
      path: "app/api/payments/cash/[paymentId]/route.ts",
      method: "PATCH",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/cash/[paymentId]/route.ts",
      method: "DELETE",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/cash/route.ts",
      method: "POST",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/charges/[chargeId]/route.ts",
      method: "PATCH",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/charges/[chargeId]/route.ts",
      method: "DELETE",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/charges/route.ts",
      method: "POST",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/fees/route.ts",
      method: "POST",
      permission: "PAYMENTS_MANAGE",
    },
    {
      path: "app/api/payments/route.ts",
      method: "GET",
      permission: "PAYMENTS_VIEW",
    },

    {
      path: "app/api/performance/route.ts",
      method: "GET",
      permission: "PERFORMANCE_VIEW",
    },

    {
      path: "app/api/players/[playerId]/route.ts",
      method: "PATCH",
      permission: "PLAYERS_UPDATE",
    },
    {
      path: "app/api/players/[playerId]/route.ts",
      method: "DELETE",
      permission: "PLAYERS_DELETE",
    },
    {
      path: "app/api/players/route.ts",
      method: "GET",
      permission: "PLAYERS_VIEW",
    },
    {
      path: "app/api/players/route.ts",
      method: "POST",
      permission: "PLAYERS_CREATE",
    },
    {
      path: "app/api/players/[playerId]/physical-measurements/route.ts",
      method: "GET",
      permission: "PLAYERS_VIEW",
    },
    {
      path: "app/api/players/[playerId]/physical-measurements/route.ts",
      method: "POST",
      permission: "PLAYERS_UPDATE",
    },
    {
      path: "app/api/players/[playerId]/physical-measurements/[measurementId]/route.ts",
      method: "PATCH",
      permission: "PLAYERS_UPDATE",
    },
    {
      path: "app/api/players/[playerId]/physical-measurements/[measurementId]/route.ts",
      method: "DELETE",
      permission: "PLAYERS_UPDATE",
    },

    {
      path: "app/api/scouting/[candidateId]/observations/[observationId]/route.ts",
      method: "PATCH",
      permission: "SCOUTING_MANAGE",
    },
    {
      path: "app/api/scouting/[candidateId]/observations/[observationId]/route.ts",
      method: "DELETE",
      permission: "SCOUTING_MANAGE",
    },
    {
      path: "app/api/scouting/[candidateId]/observations/route.ts",
      method: "GET",
      permission: "SCOUTING_VIEW",
    },
    {
      path: "app/api/scouting/[candidateId]/observations/route.ts",
      method: "POST",
      permission: "SCOUTING_MANAGE",
    },
    {
      path: "app/api/scouting/[candidateId]/route.ts",
      method: "GET",
      permission: "SCOUTING_VIEW",
    },
    {
      path: "app/api/scouting/[candidateId]/route.ts",
      method: "PATCH",
      permission: "SCOUTING_MANAGE",
    },
    {
      path: "app/api/scouting/[candidateId]/route.ts",
      method: "DELETE",
      permission: "SCOUTING_MANAGE",
    },
    {
      path: "app/api/scouting/route.ts",
      method: "GET",
      permission: "SCOUTING_VIEW",
    },
    {
      path: "app/api/scouting/route.ts",
      method: "POST",
      permission: "SCOUTING_MANAGE",
    },

    {
      path: "app/api/settings/academy/route.ts",
      method: "GET",
      permission: "SETTINGS_VIEW",
    },
    {
      path: "app/api/settings/academy/route.ts",
      method: "PATCH",
      permission: "SETTINGS_MANAGE",
    },
    {
      path: "app/api/seasons/[seasonId]/route.ts",
      method: "PATCH",
      permission: "SEASONS_MANAGE",
    },
    {
      path: "app/api/seasons/route.ts",
      method: "GET",
      permission: "SEASONS_VIEW",
    },
    {
      path: "app/api/seasons/route.ts",
      method: "POST",
      permission: "SEASONS_MANAGE",
    },

    {
      path: "app/api/staff/[membershipId]/route.ts",
      method: "PATCH",
      permission: "STAFF_UPDATE",
    },
    {
      path: "app/api/staff/[membershipId]/route.ts",
      method: "DELETE",
      permission: "STAFF_REMOVE",
    },
    {
      path: "app/api/staff/audit-logs/route.ts",
      method: "GET",
      permission: "AUDIT_LOGS_VIEW",
    },
    {
      path: "app/api/staff/invitations/[invitationId]/resend/route.ts",
      method: "POST",
      permission: "STAFF_INVITE",
    },
    {
      path: "app/api/staff/invitations/[invitationId]/route.ts",
      method: "DELETE",
      permission: "STAFF_INVITE",
    },
    {
      path: "app/api/staff/invitations/route.ts",
      method: "GET",
      permission: "STAFF_INVITE",
    },
    {
      path: "app/api/staff/profiles/[staffId]/invite/route.ts",
      method: "POST",
      permission: "STAFF_INVITE",
    },
    {
      path: "app/api/staff/route.ts",
      method: "GET",
      permission: "STAFF_VIEW",
    },

    {
      path: "app/api/teams/[teamId]/players/route.ts",
      method: "GET",
      permission: "TEAMS_VIEW",
    },
    {
      path: "app/api/teams/[teamId]/players/route.ts",
      method: "POST",
      permission: "TEAM_ROSTER_MANAGE",
    },
    {
      path: "app/api/teams/[teamId]/players/route.ts",
      method: "DELETE",
      permission: "TEAM_ROSTER_MANAGE",
    },
    {
      path: "app/api/teams/[teamId]/route.ts",
      method: "PATCH",
      permission: "TEAMS_UPDATE",
    },
    {
      path: "app/api/teams/[teamId]/route.ts",
      method: "DELETE",
      permission: "TEAMS_DELETE",
    },
    {
      path: "app/api/teams/route.ts",
      method: "GET",
      permission: "TEAMS_VIEW",
    },
    {
      path: "app/api/teams/route.ts",
      method: "POST",
      permission: "TEAMS_CREATE",
    },

    {
      path: "app/api/training-sessions/[sessionId]/attendance/route.ts",
      method: "GET",
      permission: "ATTENDANCE_VIEW",
    },
    {
      path: "app/api/training-sessions/[sessionId]/attendance/route.ts",
      method: "PATCH",
      permission: "ATTENDANCE_MANAGE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/attendance/route.ts",
      method: "DELETE",
      permission: "ATTENDANCE_MANAGE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/drills/route.ts",
      method: "GET",
      permission: "TRAINING_VIEW",
    },
    {
      path: "app/api/training-sessions/[sessionId]/drills/route.ts",
      method: "POST",
      permission: "TRAINING_UPDATE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/drills/route.ts",
      method: "PATCH",
      permission: "TRAINING_UPDATE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/drills/route.ts",
      method: "DELETE",
      permission: "TRAINING_UPDATE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/route.ts",
      method: "PATCH",
      permission: "TRAINING_UPDATE",
    },
    {
      path: "app/api/training-sessions/[sessionId]/route.ts",
      method: "DELETE",
      permission: "TRAINING_DELETE",
    },
    {
      path: "app/api/training-sessions/route.ts",
      method: "GET",
      permission: "TRAINING_VIEW",
    },
    {
      path: "app/api/training-sessions/route.ts",
      method: "POST",
      permission: "TRAINING_CREATE",
    },
    {
      path: "app/api/knowledge/[articleId]/route.ts",
      method: "GET",
      permission: "KNOWLEDGE_VIEW",
    },
    {
      path: "app/api/knowledge/[articleId]/route.ts",
      method: "PATCH",
      permission: "KNOWLEDGE_MANAGE",
    },
    {
      path: "app/api/knowledge/[articleId]/route.ts",
      method: "DELETE",
      permission: "KNOWLEDGE_MANAGE",
    },
    {
      path: "app/api/knowledge/route.ts",
      method: "GET",
      permission: "KNOWLEDGE_VIEW",
    },
    {
      path: "app/api/knowledge/route.ts",
      method: "POST",
      permission: "KNOWLEDGE_MANAGE",
    },    {
      path: "app/api/tactics/[tacticId]/route.ts",
      method: "GET",
      permission: "TACTICS_VIEW",
    },
    {
      path: "app/api/tactics/[tacticId]/route.ts",
      method: "PATCH",
      permission: "TACTICS_MANAGE",
    },
    {
      path: "app/api/tactics/[tacticId]/route.ts",
      method: "DELETE",
      permission: "TACTICS_MANAGE",
    },
    {
      path: "app/api/tactics/route.ts",
      method: "GET",
      permission: "TACTICS_VIEW",
    },
    {
      path: "app/api/tactics/route.ts",
      method: "POST",
      permission: "TACTICS_MANAGE",
    },
  ];

test("API mutation and read handlers preserve their exact permission contracts", () => {
  for (
    const contract of
    CONTRACTS
  ) {
    assertPermissionContract(
      contract
    );
  }
});

test("multi-permission endpoints preserve resource-level filtering", () => {
  const reports =
    getHandlerBlock(
      readSource(
        "app/api/reports/route.ts"
      ),
      "GET"
    );

  assert.match(
    reports,
    /requireAnyAcademyPermission/
  );

  assert.match(
    reports,
    /PERMISSIONS\.REPORTS_SPORTS_VIEW/
  );

  assert.match(
    reports,
    /PERMISSIONS\.REPORTS_FINANCE_VIEW/
  );

  assert.match(
    reports,
    /if\s*\(\s*canViewSports\s*\)/
  );

  assert.match(
    reports,
    /if\s*\(\s*canViewFinance\s*\)/
  );

  const search =
    getHandlerBlock(
      readSource(
        "app/api/search/route.ts"
      ),
      "GET"
    );

  assert.match(
    search,
    /getCurrentAcademyAccess/
  );

  assert.match(
    search,
    /PERMISSIONS\.PLAYERS_VIEW/
  );

  assert.match(
    search,
    /PERMISSIONS\.COACHES_VIEW/
  );

  assert.match(
    search,
    /PERMISSIONS\.TEAMS_VIEW/
  );

  assert.match(
    search,
    /getActiveTeamScope/
  );

  const roster =
    getHandlerBlock(
      readSource(
        "app/api/teams/[teamId]/players/route.ts"
      ),
      "GET"
    );

  assert.match(
    roster,
    /PERMISSIONS\.TEAM_ROSTER_MANAGE/
  );

  assert.match(
    roster,
    /canAccessTeam/
  );
});

function walkRoutes(
  directory: string
): string[] {
  const results:
    string[] = [];

  for (
    const name of
    readdirSync(directory)
  ) {
    const fullPath =
      join(
        directory,
        name
      );

    if (
      statSync(fullPath)
        .isDirectory()
    ) {
      results.push(
        ...walkRoutes(
          fullPath
        )
      );
    } else if (
      name === "route.ts"
    ) {
      results.push(
        fullPath
      );
    }
  }

  return results;
}

test("Prisma academy routes retain an academy-scope marker", () => {
  const special =
    new Set([
      "app/api/academy/route.ts",
      "app/api/academy-applications/route.ts",
      "app/api/platform-admin/academy-applications/route.ts",
      "app/api/platform-admin/academy-applications/[applicationId]/route.ts",
      "app/api/platform-admin/subscriptions/[subscriptionId]/custom-offer/route.ts",
      "app/api/auth/[...all]/route.ts",
      "app/api/invitations/[token]/route.ts",
      "app/api/registration-invitations/[token]/route.ts",
      "app/api/athlete-invitations/public/[token]/route.ts",
    ]);

  const apiRoot =
    join(
      process.cwd(),
      "app",
      "api"
    );

  const missingScope:
    string[] = [];

  for (
    const file of
    walkRoutes(apiRoot)
  ) {
    const path =
      relative(
        process.cwd(),
        file
      ).replaceAll(
        "\\",
        "/"
      );

    if (
      special.has(path)
    ) {
      continue;
    }

    const source =
      readFileSync(
        file,
        "utf8"
      );

    if (
      !source.includes(
        "prisma."
      )
    ) {
      continue;
    }

    if (
      !/academyId|getActiveTeamScope/.test(
        source
      )
    ) {
      missingScope.push(
        path
      );
    }
  }

  assert.deepEqual(
    missingScope,
    [],
    [
      "",
      "Prisma routes missing academy scope marker:",
      ...missingScope.map(
        (path) =>
          `- ${path}`
      ),
    ].join("\n")
  );
});