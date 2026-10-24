import {gql} from "apollo-server-express";

// العضوية الموحّدة: كل أعضاء النادي في قائمة واحدة، لكل عضو تصنيفه وحالته،
// مع بحث بالاسم أو الرقم المدني أو رقم العضوية.
export const typeDefs = gql`

    extend type Query {
        clubMembership(
            kind:   String
            status: String
            search: String
            page:   Int
            limit:  Int
        ): MembershipPage @auth(requires: user)
    }

    type MembershipPage {
        total:  Int
        page:   Int
        limit:  Int
        counts: [MembershipCount!]!
        rows:   [MembershipRow!]!
    }

    type MembershipCount {
        kind:  String
        label: String
        count: Int
    }

    type MembershipRow {
        id:                 ID
        kind:               String
        label:              String
        status:             String
        full_name:          String
        card_number:        String
        phone:              String
        personal_picture:   String @imgUrl
        membership_number:  String
        membership_date:    String
        team_id:            ID
        team_name:          String
        createdAt:          String
    }
`;
