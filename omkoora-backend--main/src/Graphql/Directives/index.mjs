import FormatDate from "./FormatDate.mjs"
import authDirective from "./AuthRoles.mjs"
import imgUrlDirective from "./ImgUrl.mjs"

const { dateDirectiveTypeDefs, dateDirectiveTransformer } = FormatDate("date")
const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective('auth')
const { imgUrlDirectiveTypeDefs, imgUrlDirectiveTransformer } = imgUrlDirective('imgUrl')

export {
    dateDirectiveTypeDefs,
    dateDirectiveTransformer,
    authDirectiveTypeDefs,
    authDirectiveTransformer,
    imgUrlDirectiveTypeDefs,
    imgUrlDirectiveTransformer
}