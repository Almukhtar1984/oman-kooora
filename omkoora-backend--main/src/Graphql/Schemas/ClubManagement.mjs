import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        clubManagement(id: ID): ClubManagement @auth(requires: user)
        allClubManagement(idClub: ID): [ClubManagement!] @auth(requires: user)
    }

    extend type Mutation {
        createClubManagement(content: contentClubManagement!): ClubManagement! @auth(requires: user)

        updateClubManagement (id: ID!, idPerson: ID!, content: contentClubManagement!): statusUpdate #@auth(requires: user)

        deleteClubManagement ( id: ID! ): statusDelete @auth(requires: user)
    }

    type ClubManagement {
        id:         ID
        membership_date:    Date @date(format: "yyyy-MM-dd")
        membership_date_end:    Date @date(format: "yyyy-MM-dd")
        role:    String

        person:     Person
        club:       Club

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentClubManagement {
        id:         ID
        membership_date:    String
        membership_date_end:    String
        role:    String
        
        user:       contentUserClubManagement
        id_club:    ID
    }


    input contentUserClubManagement {
        person:         contentPerson
        email:          String
        password:       String
        role:           String
        activation:     String
        email_verify:   String
    }
`;
