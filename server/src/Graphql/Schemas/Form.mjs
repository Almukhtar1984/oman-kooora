import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        form(id: ID): Form @auth(requires: user)
        allForms(idClub: ID): [Form!] @auth(requires: user)
    }

    extend type Mutation {
        createForm(content: contentForm!): Form! @auth(requires: user)

        updateForm (id: ID!, content: contentForm!): statusUpdate @auth(requires: user)

        deleteForm ( id: ID! ): statusDelete @auth(requires: user)
    }

    type Form {
        id:         ID
        subject:    String
        file:       String

        club:       Club

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentForm {
        subject:      String
        file:         Upload

        id_club:      ID
    }

`;
