// ./Schemas/sanctionSchema.mjs
import { gql } from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        sanction(id: ID): Sanction
        allSanctions(id_player: ID): [Sanction!]
        allSanctionsTeam(idTeam: ID): [Sanction!]
        allSanctionsClub(idClub: ID): [Sanction!]
        getAllSanctionsByPlayer(id_player: ID!): [Sanction]
        SanctionLast(id_player: ID!): Sanction
    }

    extend type Mutation {
        createSanction(content: contentSanction!): Sanction!
        updateSanction(id: ID!, content: contentSanction!): statusUpdate
        deleteSanction(id: ID!): statusDelete
    }

    type Sanction {
        id: ID
        note: String
        date_from: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        date_to: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        player: Player
        createdAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentSanction {
        note: String
        id_player: ID
        date_from: String!
        date_to: String!
    }
    
`;
