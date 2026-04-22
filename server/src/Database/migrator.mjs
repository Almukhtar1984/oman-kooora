import path from "path";
import {fileURLToPath, pathToFileURL} from "url";
import Sequelize from "sequelize";
import {SequelizeStorage, Umzug} from "umzug";

import DB from "../Config/DBContact.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "../..");

export const migrator = new Umzug({
    migrations: {
        glob: path.join(serverRoot, "migrations/*.mjs"),
        resolve: ({name, path: migrationPath, context}) => ({
            name,
            up: async () => {
                const migration = await import(pathToFileURL(migrationPath).href);
                return migration.up(context, Sequelize);
            },
            down: async () => {
                const migration = await import(pathToFileURL(migrationPath).href);
                return migration.down(context, Sequelize);
            }
        })
    },
    context: DB.getQueryInterface(),
    storage: new SequelizeStorage({
        sequelize: DB,
        tableName: "sequelize_meta"
    }),
    logger: console
});

export {DB};
