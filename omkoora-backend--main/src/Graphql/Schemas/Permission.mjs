import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        permission(id: ID): Permission #@auth(requires: user)
        allPermissionsClub(idClub: ID): [Permission!] #@auth(requires: user)
        allPermissionsTeam(idTeam: ID): [Permission!] #@auth(requires: user)
    }

    extend type Mutation {
        createPermission (content: contentPermission!): Permission! #@auth(requires: user)

        updatePermission (id: ID!, content: contentPermission!): statusUpdate #@auth(requires: user)

        deletePermission ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Permission {
        id:        ID
        teams:      String
        members:      String
        technicals:      String
        players:      String
        transfer_players:      String
        loan_players:      String
        assembly:      String
        inbox:      String
        outbox:      String
        meeting:      String
        blogs:      String
        forms:      String
        permissions:      String

        complaints:      String
        expenses:      String
        leagues:      String

        user:      User

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentPermission {
        teams:      [String]
        members:      [String]
        technicals:      [String]
        players:      [String]
        transfer_players:      [String]
        loan_players:      [String]
        assembly:      [String]
        inbox:      [String]
        outbox:      [String]
        meeting:      [String]
        blogs:      [String]
        forms:      [String]
        permissions:      [String]

        complaints:      [String]
        expenses:      [String]
        leagues:      [String]


        id_user:   ID
    }
`;
