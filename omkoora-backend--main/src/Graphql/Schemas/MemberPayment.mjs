import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        # One row per team member with the running total they have paid and the
        # full list of their individual payments.
        memberAccountsTeam(idTeam: ID): [MemberAccount!] @auth(requires: user)
    }

    extend type Mutation {
        createMemberPayment(content: contentMemberPayment!): MemberPayment! @auth(requires: user)
        deleteMemberPayment(id: ID!): statusDelete @auth(requires: user)
    }

    type MemberPayment {
        id:           ID
        amount:       Float
        note:         String
        # DATEONLY serialises to "yyyy-MM-dd" (or null) on its own — keeping it a
        # plain String avoids the @date directive turning a null into 1970-01-01.
        payment_date: String
        createdAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type MemberAccount {
        member:    Member
        totalPaid: Float
        payments:  [MemberPayment!]
    }

    input contentMemberPayment {
        amount:       Float!
        note:         String
        payment_date: String
        id_member:    ID!
        id_team:      ID!
    }
`;
