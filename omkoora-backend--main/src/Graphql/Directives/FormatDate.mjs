import { format as formatDate } from 'date-fns'

import {defaultFieldResolver } from 'graphql'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'

const pad2 = (n) => (n < 10 ? "0" + n : "" + n)
const pad4 = (n) => (n < 10 ? "000" + n : n < 100 ? "00" + n : n < 1000 ? "0" + n : "" + n)

// The handful of tokens the schemas actually use. Anything else falls back to
// date-fns, so behaviour never changes for a pattern we don't recognise.
const TOKENS = {
    yyyy: (d) => pad4(d.getFullYear()),
    MM:   (d) => pad2(d.getMonth() + 1),
    dd:   (d) => pad2(d.getDate()),
    HH:   (d) => pad2(d.getHours()),
    mm:   (d) => pad2(d.getMinutes()),
    ss:   (d) => pad2(d.getSeconds()),
}

// Parse the pattern once, when the schema is built, instead of re-parsing it for
// every date field of every row. Returns null when the pattern contains letters
// we don't handle, so the caller keeps using date-fns for it.
const compileFormat = (pattern) => {
    const parts = []
    let literal = ""
    let i = 0

    while (i < pattern.length) {
        const token = TOKENS[pattern.substr(i, 4)] ? pattern.substr(i, 4)
                    : TOKENS[pattern.substr(i, 2)] ? pattern.substr(i, 2)
                    : null

        if (token) {
            if (literal) { parts.push(literal); literal = "" }
            parts.push(TOKENS[token])
            i += token.length
            continue
        }

        const char = pattern[i]
        // A bare letter is a date-fns token we don't implement (or a quoted
        // section) — bail out and let date-fns handle the whole pattern.
        if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "'") return null

        literal += char
        i += 1
    }

    if (literal) parts.push(literal)
    return parts
}

const makeFormatter = (pattern) => {
    const parts = compileFormat(pattern)
    if (!parts) return (date) => formatDate(date, pattern)

    return (date) => {
        let out = ""
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            out += typeof part === "string" ? part : part(date)
        }
        return out
    }
}

export default function dateDirective(directiveName) {
    return {
        dateDirectiveTypeDefs: `directive @${directiveName}(format: String = "dd/mm/yyyy HH:MM:ss") on FIELD_DEFINITION`,

        dateDirectiveTransformer: (schema) => mapSchema(schema, {
            [MapperKind.OBJECT_FIELD]: fieldConfig => {
                let dateDirective = getDirective(schema, fieldConfig, directiveName)
                if (dateDirective)  dateDirective = dateDirective[0]

                if (dateDirective) {
                    const { resolve = defaultFieldResolver } = fieldConfig
                    const { format } = dateDirective
                    const fastFormat = makeFormatter(format)

                    const apply = (value) => {
                        const date = new Date(value)
                        // Invalid dates go through date-fns so the thrown error
                        // stays identical to what callers saw before.
                        if (Number.isNaN(date.getTime())) return formatDate(date, format)
                        return fastFormat(date)
                    }

                    // Stays synchronous for the usual case: awaiting here created
                    // one promise per date field per row (~50k on a big list).
                    fieldConfig.resolve = (source, args, context, info) => {
                        const value = resolve(source, args, context, info)
                        if (value && typeof value.then === "function") return value.then(apply)
                        return apply(value)
                    }
                    return fieldConfig
                }
            }
        })
    }
}
