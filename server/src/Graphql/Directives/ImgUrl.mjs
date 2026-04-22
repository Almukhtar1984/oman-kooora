import { format as formatDate } from 'date-fns'
import {defaultFieldResolver } from 'graphql'
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'
import dotenv from 'dotenv'

dotenv.config();
const API_URL = process.env.API_URL

export default function imgUrlDirective(directiveName) {
    return {
        imgUrlDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,

        imgUrlDirectiveTransformer: (schema) => mapSchema(schema, {
            [MapperKind.OBJECT_FIELD]: fieldConfig => {
                let imgUrlDirective = getDirective(schema, fieldConfig, directiveName)
                if (imgUrlDirective)  imgUrlDirective = imgUrlDirective[0]

                if (imgUrlDirective) {
                    const { resolve = defaultFieldResolver } = fieldConfig

                    fieldConfig.resolve = async (source, args, context, info) => {
                        const imgName = await resolve(source, args, context, info)

                        if (imgName !== null) {
                            return `${API_URL}/images/${imgName}`
                        }
                        return ``
                    }
                    return fieldConfig
                }
            }
        })
    }
}
