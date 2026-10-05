import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath = path.join(
  process.cwd(),
  "app",
  "api",
  "reports",
  "route.ts"
);

const source = fs.readFileSync(
  routePath,
  "utf8"
);

test("reports period requires both from and to", () => {
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

test("reports period validates YYYY-MM-DD dates", () => {
  assert.match(
    source,
    /\\d\{4\}-\\d\{2\}-\\d\{2\}/
  );

  assert.match(
    source,
    /parseDateOnly\(fromParam\)/
  );

  assert.match(
    source,
    /parseDateOnly\(toParam\)/
  );
});

test("reports period rejects reversed ranges", () => {
  assert.match(
    source,
    /start\.getTime\(\)\s*>\s*end\.getTime\(\)/
  );

  assert.match(
    source,
    /Data 'Nga' nuk mund të jetë pas datës 'Deri më'/
  );
});

test("reports period includes the full to date", () => {
  assert.match(
    source,
    /nextUtcDay\(end\)/
  );

  assert.match(
    source,
    /lt:\s*period\.endExclusive/
  );
});

test("reports period filters training sessions by academy, team scope and period", () => {
  assert.match(
    source,
    /prisma\.trainingSession\.count/
  );

  assert.match(
    source,
    /trainingSession\.count\(\{[\s\S]*academyId[\s\S]*startsAt:\s*\{[\s\S]*gte:\s*period\.start[\s\S]*lt:\s*period\.endExclusive/
  );

  assert.match(
    source,
    /teamId:\s*\{[\s\S]*in:\s*teamScope\.teamIds/
  );
});

test("reports period filters matches by academy, team scope and period", () => {
  assert.match(
    source,
    /prisma\.match\.count/
  );

  assert.match(
    source,
    /match\.count\(\{[\s\S]*academyId[\s\S]*startsAt:\s*\{[\s\S]*gte:\s*period\.start[\s\S]*lt:\s*period\.endExclusive/
  );
});

test("reports period filters payments and expenses by academy and period", () => {
  assert.match(
    source,
    /prisma\.cashPayment\.findMany/
  );

  assert.match(
    source,
    /paidAt:\s*\{[\s\S]*gte:\s*period\.start[\s\S]*lt:\s*period\.endExclusive/
  );

  assert.match(
    source,
    /prisma\.expense\.findMany/
  );

  assert.match(
    source,
    /expenseDate:\s*\{[\s\S]*gte:\s*period\.start[\s\S]*lt:\s*period\.endExclusive/
  );
});

test("reports period preserves report permissions", () => {
  assert.match(
    source,
    /PERMISSIONS\.REPORTS_SPORTS_VIEW/
  );

  assert.match(
    source,
    /PERMISSIONS\.REPORTS_FINANCE_VIEW/
  );

  assert.match(
    source,
    /requireAnyAcademyPermission/
  );
});

test("reports period returns sports and finance summaries", () => {
  assert.match(
    source,
    /periodReport\s*=\s*\{/
  );

  assert.match(
    source,
    /sports:\s*periodSports/
  );

  assert.match(
    source,
    /finance:\s*periodFinance/
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
});