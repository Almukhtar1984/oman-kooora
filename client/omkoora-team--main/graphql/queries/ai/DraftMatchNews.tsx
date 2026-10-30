import { gql } from "@apollo/client";

// خبر المباراة مسودّةً — لا يُحفظ: يُملأ به نموذج «إضافة خبر»، فيراجعه صاحبه
// ويرفق صوره ثم ينشره.
export const DraftMatchNews = gql`
    mutation DraftMatchNews($id_match: ID!) {
        draftMatchNews(id_match: $id_match) {
            subject
            short_description
            description
        }
    }
`;
