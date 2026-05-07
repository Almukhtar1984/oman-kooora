import {DB, migrator} from "../src/Database/migrator.mjs";

const command = process.argv[2] || "up";

const printStatus = async () => {
    const [executed, pending] = await Promise.all([
        migrator.executed(),
        migrator.pending()
    ]);

    executed.forEach((migration) => {
        console.log(`[up] ${migration.name}`);
    });

    pending.forEach((migration) => {
        console.log(`[down] ${migration.name}`);
    });
}

try {
    if (command === "up") {
        const migrations = await migrator.up();
        migrations.forEach((migration) => console.log(`[up] ${migration.name}`));
    } else if (command === "down") {
        const migrations = await migrator.down();
        migrations.forEach((migration) => console.log(`[down] ${migration.name}`));
    } else if (command === "status") {
        await printStatus();
    } else {
        console.error(`Unknown migration command: ${command}`);
        process.exitCode = 1;
    }
} finally {
    await DB.close();
}
