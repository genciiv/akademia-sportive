import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  "components/stafi/stafi-client.tsx",
  "utf8",
);

test("staff invitation UI consumes non-blocking email delivery results", () => {
  const deliveryTypes =
    source.match(/emailDelivery\?:\s*\{/g) ?? [];

  const deliveryChecks =
    source.match(
      /data\.emailDelivery\?\.ok\s*===\s*true/g,
    ) ?? [];

  assert.equal(deliveryTypes.length, 2);
  assert.equal(deliveryChecks.length, 2);

  assert.match(
    source,
    /Email-i i ftes\\u00ebs u d\\u00ebrgua automatikisht/,
  );

  assert.match(
    source,
    /Email-i i ftes\\u00ebs nuk u d\\u00ebrgua/,
  );
});

test("staff invitation UI keeps manual link fallback and existing-account linking", () => {
  assert.match(
    source,
    /navigator\.clipboard\.writeText/,
  );

  assert.match(
    source,
    /data\.invitation\?\.invitePath/,
  );

  assert.match(
    source,
    /if \(data\.accessLinked\)/,
  );

  assert.match(
    source,
    /Llogaria ekzistuese u lidh me sukses/,
  );
});
