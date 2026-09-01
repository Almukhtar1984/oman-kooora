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

                    const apply = (imgName) => {
                        if (imgName !== null && imgName !== undefined && imgName !== "") {
                            if (typeof imgName === 'string' && imgName.startsWith('http')) {
                                const parts = imgName.split('/')
                                return parts[parts.length - 1]
                            }
                            return imgName
                        }
                        return ``
                    }

                    // Kept synchronous: awaiting here allocated a promise per
                    // field per row on every list query.
                    fieldConfig.resolve = (source, args, context, info) => {
                        const imgName = resolve(source, args, context, info)
                        if (imgName && typeof imgName.then === "function") return imgName.then(apply)
                        return apply(imgName)
                    }
                    return fieldConfig
                }
            }
        })
    }
}