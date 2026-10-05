import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath = path.join(
  process.cwd(),
  "app",
  "api",
  "finance",
  "route.ts"
);

const source = fs.readFileSync(
  routePath,
  "utf8"
);

test("finance period report requires both from and to", () => {
  assert.match(
    source,
    /Boolean\(fromParam \|\| toParam\)/
  );

  assert.match(
    source,
    /!fromParam \|\| !toParam/
  );

  assert.match(
    source,
    /status:\s*400/
  );
});

test("finance period report validates YYYY-MM-DD dates", () => {
  assert.match(
    source,
    /\\d\{4\}-\\d\{2\}-\\d\{2\}/
  );

  assert.match(
    source,
    /parseDateOnlyUtc\(fromParam\)/
  );

  assert.match(
    source,
    /parseDateOnlyUtc\(toParam\)/
  );
});

test("finance period report rejects reversed ranges", () => {
  assert.match(
    source,
    /periodFrom > periodTo/
  );

  assert.match(
    source,
    /Data fillestare nuk mund të jetë pas datës përfundimtare/
  );
});

test("finance period report includes the full to date", () => {
  assert.match(
    source,
    /addUtcDays\(periodTo,\s*1\)/
  );

  assert.match(
    source,
    /lt:\s*periodEndExclusive/
  );
});

test("finance period report filters payments and expenses by academy and period", () => {
  assert.match(
    source,
    /prisma\.cashPayment\.findMany/
  );

  assert.match(
    source,
    /paidAt:\s*\{[\s\S]*gte:\s*periodFrom[\s\S]*lt:\s*periodEndExclusive/
  );

  assert.match(
    source,
    /prisma\.expense\.findMany/
  );

  assert.match(
    source,
    /expenseDate:\s*\{[\s\S]*gte:\s*periodFrom[\s\S]*lt:\s*periodEndExclusive/
  );
});

test("finance period report returns financial summary and detail collections", () => {
  assert.match(
    source,
    /periodReport\s*=\s*\{/
  );

  assert.match(
    source,
    /collectedLek/
  );

  assert.match(
    source,
    /expensesLek/
  );

  assert.match(
    source,
    /netLek/
  );

  assert.match(
    source,
    /paymentCount/
  );

  assert.match(
    source,
    /expenseCount/
  );

  assert.match(
    source,
    /payingPlayers/
  );

  assert.match(
    source,
    /expenseCategories/
  );

  assert.match(
    source,
    /payments:\s*periodPayments/
  );

  assert.match(
    source,
    /expenses:\s*periodExpenses/
  );
});