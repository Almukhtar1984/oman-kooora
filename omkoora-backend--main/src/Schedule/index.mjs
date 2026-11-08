import cron from 'node-cron';
import {cleanUp as cleanUpExpiredLoan} from "./loanCleanup.mjs"
import {cleanUp as cleanUpExpiredSanctions} from "./sanctionCleanup.mjs"
import {cleanUp as stopTeamsWhoseRegistrationEnded} from "./teamRegistrationExpiry.mjs"

// A stand-by instance (started during a zero-downtime deploy) must not run the
// nightly clean-up as well, or expired loans/sanctions get processed twice.
if (process.env.DISABLE_CRON === "true") {
    console.info("Scheduled jobs disabled (DISABLE_CRON=true)")
} else {
    cron.schedule('0 0 * * *', () => {
        cleanUpExpiredSanctions();
        cleanUpExpiredLoan();
    });
    // A registration period ends at midnight in Oman, whatever the server's
    // own clock says. Sign-in already refuses the team from that minute; this
    // turns its card «متوقف» and tells the club.
    cron.schedule('5 0 * * *', () => {
        stopTeamsWhoseRegistrationEnded();
    }, { timezone: 'Asia/Muscat' });
}
