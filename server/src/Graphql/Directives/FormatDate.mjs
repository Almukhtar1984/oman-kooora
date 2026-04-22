import { format as formatDate } from 'date-fns'
import dateFnsTZ from 'date-fns-tz'
const { formatInTimeZone } = dateFnsTZ;

import {defaultFieldResolver } from 'graphql'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'

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
                    fieldConfig.resolve = async (source, args, context, info) => {
                        const date = await resolve(source, args, context, info)
                        return formatDate(new Date(date), format)
                    }
                    return fieldConfig
                }
            }
        })
    }
}