// What @date does with a column that has no date in it.
//
// It used to hand the value straight to new Date(): new Date(null) is the Unix
// epoch, so every empty date column came back as "1970-01-01". Cards printed
// "تاريخ الانتقال: 1970-01-01" for transfers that simply had no date, and the
// clients grew hacks like `date_start !== "1970-01-01"` to hide it.

import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";
import dateDirective from "../src/Graphql/Directives/FormatDate.mjs";

const { dateDirectiveTypeDefs, dateDirectiveTransformer } = dateDirective("date");

const typeDefs = `
    ${dateDirectiveTypeDefs}
    scalar Date
    type Row {
        day: Date @date(format: "yyyy-MM-dd")
        stamp: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }
    type Query { row(day: String, stamp: String): Row }
`;

const schema = dateDirectiveTransformer(makeExecutableSchema({
    typeDefs,
    resolvers: { Query: { row: (_, args) => args } },
}));

const ask = async (vars) => {
    const res = await graphql({
        schema,
        source: `query ($day: String, $stamp: String) { row(day: $day, stamp: $stamp) { day stamp } }`,
        variableValues: vars,
    });
    if (res.errors) throw res.errors[0];
    return res.data.row;
};

let pass = 0, fail = 0;
const check = (label, got, want) => {
    if (got === want) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const run = async () => {
    const empty = await ask({ day: null, stamp: null });
    check("تاريخ فارغ يرجع فارغاً لا 1970", empty.day, null);
    check("ختم زمني فارغ يرجع فارغاً", empty.stamp, null);

    const blank = await ask({ day: "", stamp: "" });
    check("نص فارغ يرجع فارغاً", blank.day, null);

    const real = await ask({ day: "2026-10-22", stamp: "2026-10-22T08:34:57" });
    check("تاريخ حقيقي يُنسَّق كما كان", real.day, "2026-10-22");
    check("الختم الزمني يُنسَّق كما كان", real.stamp, "2026-10-22 08:34:57");

    // The epoch is a real date when someone really stored it.
    const epoch = await ask({ day: "1970-01-01", stamp: null });
    check("1970 المكتوب فعلاً يبقى كما هو", epoch.day, "1970-01-01");

    console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
    process.exit(fail ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
