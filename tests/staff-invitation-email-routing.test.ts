import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const inviteRoute = fs.readFileSync(
  "app/api/staff/profiles/[staffId]/invite/route.ts",
  "utf8",
);

const resendRoute = fs.readFileSync(
  "app/api/staff/invitations/[invitationId]/resend/route.ts",
  "utf8",
);

test("staff invite emails preserve existing tokens and send new invitations after persistence", () => {
  assert.match(
    inviteRoute,
    /sendStaffInvitationEmail/,
  );

  assert.match(
    inviteRoute,
    /invitationToken:\s*existingInvitation\.token/,
  );

  assert.match(
    inviteRoute,
    /invitationToken:\s*token/,
  );

  assert.match(
    inviteRoute,
    /academyName:\s*access\.academy\.name/,
  );

  assert.match(
    inviteRoute,
    /emailDelivery,/,
  );

  const transactionIndex =
    inviteRoute.lastIndexOf(
      "await prisma.$transaction(",
    );

  const newEmailIndex =
    inviteRoute.lastIndexOf(
      "await sendStaffInvitationEmail({",
    );

  assert.ok(
    transactionIndex !== -1 &&
      newEmailIndex > transactionIndex,
    "New STAFF invitation must be persisted before email delivery.",
  );
});

test("staff resend emails use the replacement token after persistence", () => {
  assert.match(
    resendRoute,
    /sendStaffInvitationEmail/,
  );

  assert.match(
    resendRoute,
    /invitationToken:\s*token/,
  );

  assert.match(
    resendRoute,
    /academyName:\s*access\.academy\.name/,
  );

  assert.match(
    resendRoute,
    /emailDelivery,/,
  );

  const transactionIndex =
    resendRoute.indexOf(
      "await prisma.$transaction(",
    );

  const emailIndex =
    resendRoute.indexOf(
      "await sendStaffInvitationEmail({",
    );

  assert.ok(
    transactionIndex !== -1 &&
      emailIndex > transactionIndex,
    "Replacement STAFF invitation must be persisted before email delivery.",
  );
});
