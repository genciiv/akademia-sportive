import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const matchRoute =
  "app/api/matches/[matchId]/route.ts";

const statsRoute =
  "app/api/matches/[matchId]/stats/route.ts";

const eventsRoute =
  "app/api/matches/[matchId]/events/route.ts";

const performanceRoute =
  "app/api/matches/[matchId]/performance/route.ts";

test("completed matches require a complete score", () => {
  const source =
    fs.readFileSync(
      matchRoute,
      "utf8"
    );

  assert.match(
    source,
    /Rezultati duhet të plotësohet për të dy ekipet/
  );

  assert.match(
    source,
    /status === "COMPLETED"[\s\S]*ourScore === null[\s\S]*opponentScore === null/
  );

  assert.match(
    source,
    /Një ndeshje e përfunduar duhet të ketë rezultat/
  );
});

test("inter academy results synchronize atomically", () => {
  const source =
    fs.readFileSync(
      matchRoute,
      "utf8"
    );

  assert.match(
    source,
    /homeInterAcademyMatch/
  );

  assert.match(
    source,
    /awayInterAcademyMatch/
  );

  assert.match(
    source,
    /prisma\.\$transaction/
  );

  assert.match(
    source,
    /tx\.interAcademyMatch\.update/
  );

  assert.match(
    source,
    /tx\.match\.update/
  );
});

test("inter academy sibling result is mirrored", () => {
  const source =
    fs.readFileSync(
      matchRoute,
      "utf8"
    );

  assert.match(
    source,
    /ourScore:\s*opponentScore/
  );

  assert.match(
    source,
    /opponentScore:\s*ourScore/
  );

  assert.match(
    source,
    /currentIsHome[\s\S]*homeScore[\s\S]*awayScore/
  );
});

test("existing result statistics stack remains intact", () => {
  const stats =
    fs.readFileSync(
      statsRoute,
      "utf8"
    );

  const events =
    fs.readFileSync(
      eventsRoute,
      "utf8"
    );

  const performance =
    fs.readFileSync(
      performanceRoute,
      "utf8"
    );

  assert.match(
    stats,
    /playerStatistics/
  );

  assert.match(
    stats,
    /totals/
  );

  assert.match(
    events,
    /MATCH_EVENTS_MANAGE/
  );

  assert.match(
    performance,
    /playerMatchPerformance\.upsert/
  );
});
const clientPath =
  "components/ndeshjet/ndeshjet-client.tsx";

test("professional finalize match workflow is exposed in match details", () => {
  const client =
    fs.readFileSync(
      clientPath,
      "utf8"
    );

  assert.match(
    client,
    /Përfundo ndeshjen/
  );

  assert.match(
    client,
    /Konfirmo rezultatin final/
  );

  assert.match(
    client,
    /Ruaj dhe përfundo/
  );

  assert.match(
    client,
    /status:\s*"COMPLETED"/
  );
});

test("finalize workflow submits both scores through the protected match endpoint", () => {
  const client =
    fs.readFileSync(
      clientPath,
      "utf8"
    );

  assert.match(
    client,
    /async function perfundoNdeshjen/
  );

  assert.match(
    client,
    /method:\s*"PATCH"/
  );

  assert.match(
    client,
    /ourScore:\s*rezultatiYne/
  );

  assert.match(
    client,
    /opponentScore:\s*rezultatiKundershtarit/
  );

  assert.match(
    client,
    /ndeshjaEDetajuar\.status === "SCHEDULED"/
  );
});