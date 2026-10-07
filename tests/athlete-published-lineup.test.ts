import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const listPath =
  "app/sportist/(portal)/ndeshjet/page.tsx";

const detailPath =
  "app/sportist/(portal)/ndeshjet/[matchId]/page.tsx";

const pitchPath =
  "components/sportist/athlete-lineup-pitch.tsx";

test("athlete match list hides starter and bench status before publication", () => {
  const page =
    fs.readFileSync(
      listPath,
      "utf8"
    );

  assert.match(
    page,
    /lineupPublishedAt:\s*true/
  );

  assert.match(
    page,
    /!match\.lineupPublishedAt/
  );

  assert.match(
    page,
    /I grumbulluar/
  );

  assert.match(
    page,
    /Titullar/
  );

  assert.match(
    page,
    /Zëvendësues/
  );
});

test("athlete match detail reads publication and lineup slot state", () => {
  const page =
    fs.readFileSync(
      detailPath,
      "utf8"
    );

  assert.match(
    page,
    /lineupFormation:\s*true/
  );

  assert.match(
    page,
    /lineupPublishedAt:\s*true/
  );

  assert.match(
    page,
    /lineupSlot:\s*true/
  );

  assert.match(
    page,
    /const lineupIsPublished/
  );
});

test("athlete match detail renders the pitch only after publication", () => {
  const page =
    fs.readFileSync(
      detailPath,
      "utf8"
    );

  assert.match(
    page,
    /!lineupIsPublished/
  );

  assert.match(
    page,
    /Formacioni nuk është publikuar ende/
  );

  assert.match(
    page,
    /<AthleteLineupPitch/
  );

  assert.match(
    page,
    /formation=\{match\.lineupFormation!\}/
  );

  assert.match(
    page,
    /currentPlayerId=\{access\.playerId\}/
  );
});

test("published athlete pitch highlights the linked athlete and shows substitutes", () => {
  const pitch =
    fs.readFileSync(
      pitchPath,
      "utf8"
    );

  assert.match(
    pitch,
    /FORMATION_LAYOUTS/
  );

  assert.match(
    pitch,
    /player\.playerId ===\s*currentPlayerId/
  );

  assert.match(
    pitch,
    /TI\s*·\s*\$\{slot\}/
  );

  assert.match(
    pitch,
    /item\.role === "SUBSTITUTE"/
  );

  assert.match(
    pitch,
    /Stoli/
  );

  assert.match(
    pitch,
    /perspective:1400px/
  );

  assert.match(
    pitch,
    /rotateX\(7deg\)/
  );
});