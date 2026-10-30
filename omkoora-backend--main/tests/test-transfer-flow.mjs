#!/usr/bin/env node
/**
 * Unit tests for the transfer/loan approval state machine (no DB/IO).
 *   node tests/test-transfer-flow.mjs
 */
import {
    initialTransferStatus, transferTransition, pendingApprover, TRANSFER_STATUSES,
    resolveDestinationTeam,
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
eq(initialTransferStatus({ callerIsClub: true, sameClub: true }), "waiting_payment",
    "a club creating an internal move has agreed with itself — but still owes the fee and final approval");
eq(initialTransferStatus({ callerIsClub: true, sameClub: true, isRequest: false }), "accepted",
    "a club returning a loan is done at once — a return is not a request");

// ───────────── the full teamA → clubA → clubB → teamB chain ─────────────
// team creates external → waiting_club_from
let s = initialTransferStatus({ callerIsClub: false, sameClub: false });
let t1 = transferTransition(s, "accepted", false); // clubA approves
eq(t1, { status: "waiting_club_to", agreed: false }, "clubA approval advances to the destination club (no move yet)");
let t2 = transferTransition(t1.status, "accepted", false); // clubB approves
eq(t2, { status: "waiting_payment", agreed: true },
    "clubB approval completes the chain — the player does NOT move yet: fee and final approval remain");

// internal move via a team: clubA approval finalizes (no clubB)
let si = initialTransferStatus({ callerIsClub: false, sameClub: true });
eq(transferTransition(si, "accepted", true), { status: "waiting_payment", agreed: true },
    "an internal move needs only the own-club approval to complete the chain");

// ───────────── rejection at any stage ─────────────
eq(transferTransition("waiting_club_from", "rejected", false), { status: "rejected", agreed: false },
    "clubA can reject");
eq(transferTransition("waiting_club_to", "rejected", false), { status: "rejected", agreed: false },
    "clubB can reject");

// ───────────── legacy + no-op ─────────────
eq(transferTransition("waiting", "accepted", false), { status: "waiting_payment", agreed: true },
    "a legacy 'waiting' row is agreed on accept, and then owes its fee like any other");
eq(transferTransition("waiting_payment", "accepted", false), { status: "waiting_payment", agreed: false },
    "an agreed row is past the chain — accepting it again does nothing here");
eq(transferTransition("accepted", "accepted", false), { status: "accepted", agreed: false },
    "an already-accepted row does not re-agree");
eq(transferTransition("waiting_club_from", "weird", false), { status: "waiting_club_from", agreed: false },
    "an unknown decision is a no-op");

// ───────────── pendingApprover (UI gating) ─────────────
eq(pendingApprover("waiting_club_from"), "from", "from-club is the approver at waiting_club_from");
eq(pendingApprover("waiting_club_to"), "to", "to-club is the approver at waiting_club_to");
eq(pendingApprover("waiting"), "to", "legacy waiting is the receiver's turn");
eq(pendingApprover("accepted"), null, "a finalized row has no pending approver");
eq(pendingApprover("rejected"), null, "a rejected row has no pending approver");
eq(pendingApprover("waiting_payment"), null, "an agreed row waits on the road, not on a club's chain decision");

assert(TRANSFER_STATUSES.includes("waiting_club_from") && TRANSFER_STATUSES.includes("waiting_club_to")
    && TRANSFER_STATUSES.includes("waiting_payment"),
    "the stage statuses are exported");

// ───────────── who picks the destination team ─────────────
// The receiving club does. A team id sent by anyone else is ignored, which also
// closes the door on a sending club parking a player in a same-named team of a
// club it does not belong to.
const RUSTAQ = "club-rustaq", BAHLA = "club-bahla";

eq(resolveDestinationTeam({
        storedTeamId: null, requestedTeamId: "team-bahla-jazira",
        requestedTeamClubId: BAHLA, destinationClubId: BAHLA, callerClubId: BAHLA,
    }), "team-bahla-jazira",
    "the destination club's own team is accepted");

eq(resolveDestinationTeam({
        storedTeamId: null, requestedTeamId: "team-rustaq-jazira",
        requestedTeamClubId: RUSTAQ, destinationClubId: BAHLA, callerClubId: RUSTAQ,
    }), null,
    "a team of the sending club is refused as the destination");

eq(resolveDestinationTeam({
        storedTeamId: "team-bahla-first", requestedTeamId: "team-rustaq-jazira",
        requestedTeamClubId: RUSTAQ, destinationClubId: BAHLA, callerClubId: RUSTAQ,
    }), "team-bahla-first",
    "a refused pick leaves the stored team untouched");

eq(resolveDestinationTeam({ storedTeamId: "team-x", requestedTeamId: null }), "team-x",
    "sending no team keeps the stored one");

eq(resolveDestinationTeam({
        storedTeamId: null, requestedTeamId: "team-y",
        requestedTeamClubId: RUSTAQ, destinationClubId: null, callerClubId: RUSTAQ,
    }), "team-y",
    "an internal row with no destination club falls back to the caller's club");

eq(resolveDestinationTeam({
        storedTeamId: null, requestedTeamId: "team-y",
        requestedTeamClubId: BAHLA, destinationClubId: null, callerClubId: RUSTAQ,
    }), null,
    "and refuses another club's team there too");

eq(resolveDestinationTeam({
        storedTeamId: null, requestedTeamId: "team-y",
        requestedTeamClubId: BAHLA, destinationClubId: null, callerClubId: null,
    }), "team-y",
    "a caller with no club of their own (super-admin) is trusted");

eq(resolveDestinationTeam({
        storedTeamId: "team-keep", requestedTeamId: "team-unknown",
        requestedTeamClubId: null, destinationClubId: BAHLA, callerClubId: BAHLA,
    }), "team-keep",
    "a team whose club cannot be read is not used");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
