import cron from 'node-cron';
import {cleanUp as cleanUpExpiredLoan} from "./loanCleanup.mjs"
import {cleanUp as cleanUpExpiredSanctions} from "./sanctionCleanup.mjs"



cron.schedule('0 0 * * *', () => {
    cleanUpExpiredSanctions();
    cleanUpExpiredLoan();
});
