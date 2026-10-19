#!/usr/bin/env node
/**
 * Unit tests for the transfer/loan approval state machine (no DB/IO).
 *   node tests/test-transfer-flow.mjs
 */
import {
    initialTransferStatus, transferTransition, pendingApprover, TRANSFER_STATUSES,
} from "../src/Helpers/transferFlow.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg} ${c.dim}(got ${JSON.stringify(a)})${c.reset}`);

// ───────────── initial status ─────────────
eq(initialTransferStatus({ callerIsClub: false, sameClub: false }), "waiting_club_from",
    "a team creating a cross-club move starts at its own club (waiting_club_from)");
eq(initialTransferStatus({ callerIsClub: false, sameClub: true }), "waiting_club_from",
    "a team creating an internal move also starts at its own club");
eq(initialTransferStatus({ callerIsClub: true, sameClub: false }), "waiting_club_to",
    "a club creating a cross-club move goes straight to the destination club");
eq(initialTransferStatus({ callerIsClub: true, sameClub: true }), "accepted",
    "a club creating an internal move is accepted immediately");

// ───────────── the full teamA → clubA → clubB → teamB chain ─────────────
// team creates external → waiting_club_from
let s = initialTransferStatus({ callerIsClub: false, sameClub: false });
let t1 = transferTransition(s, "accepted", false); // clubA approves
eq(t1, { status: "waiting_club_to", finalize: false }, "clubA approval advances to the destination club (no move yet)");
let t2 = transferTransition(t1.status, "accepted", false); // clubB approves
eq(t2, { status: "accepted", finalize: true }, "clubB approval finalizes the move (player changes team)");

// internal move via a team: clubA approval finalizes (no clubB)
let si = initialTransferStatus({ callerIsClub: false, sameClub: true });
eq(transferTransition(si, "accepted", true), { status: "accepted", finalize: true },
    "an internal move needs only the own-club approval to finalize");

// ───────────── rejection at any stage ─────────────
eq(transferTransition("waiting_club_from", "rejected", false), { status: "rejected", finalize: false },
    "clubA can reject");
eq(transferTransition("waiting_club_to", "rejected", false), { status: "rejected", finalize: false },
    "clubB can reject");

// ───────────── legacy + no-op ─────────────
eq(transferTransition("waiting", "accepted", false), { status: "accepted", finalize: true },
    "a legacy 'waiting' row finalizes on accept (backward compatible)");
eq(transferTransition("accepted", "accepted", false), { status: "accepted", finalize: false },
    "an already-accepted row does not re-finalize");
eq(transferTransition("waiting_club_from", "weird", false), { status: "waiting_club_from", finalize: false },
    "an unknown decision is a no-op");

// ───────────── pendingApprover (UI gating) ─────────────
eq(pendingApprover("waiting_club_from"), "from", "from-club is the approver at waiting_club_from");
eq(pendingApprover("waiting_club_to"), "to", "to-club is the approver at waiting_club_to");
eq(pendingApprover("waiting"), "to", "legacy waiting is the receiver's turn");
eq(pendingApprover("accepted"), null, "a finalized row has no pending approver");
eq(pendingApprover("rejected"), null, "a rejected row has no pending approver");

assert(TRANSFER_STATUSES.includes("waiting_club_from") && TRANSFER_STATUSES.includes("waiting_club_to"),
    "the new stage statuses are exported");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
