import {gql} from "apollo-server-express";

// استقالة اللاعب / إخلاء الطرف.
// الفريق أو النادي يرفع الطلب، والنادي وحده يعتمده أو يرفضه. وبالاعتماد
// يتحرّر اللاعب من فريقه ويصبح متاحاً للتسجيل في نادٍ جديد.
export const typeDefs = gql`

    extend type Query {
        # طلبات إخلاء الطرف — يراها النادي كلها، ويرى الفريق طلباته.
        allPlayerReleases(idClub: ID, idTeam: ID, status: String): [PlayerRelease!] @auth(requires: user)
        playerRelease(id: ID!): PlayerRelease @auth(requires: user)
    }

    extend type Mutation {
        # رفع طلب استقالة/إخلاء طرف للاعب مع خطاب الاستقالة.
        createPlayerRelease(content: contentPlayerRelease!): PlayerRelease! @auth(requires: user)
        # قرار النادي: accepted (يتحرّر اللاعب) أو rejected مع ذكر السبب.
        decidePlayerRelease(id: ID!, status: String!, note: String): statusUpdate @auth(requires: user)
    }

    input contentPlayerRelease {
        id_player:  ID!
        reason:     String
        letter:     Upload
    }

    type PlayerRelease {
        id:              ID
        reason:          String
        letter:          String @imgUrl
        status:          String
        note:            String
        requested_at:    Date @date(format: "yyyy-MM-dd")
        decided_at:      Date @date(format: "yyyy-MM-dd")
        player:          Player
        team:            Team
        club:            Club
        createdAt:       Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }
`;
