import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        technicalApparatus(id: ID): TechnicalApparatus @auth(requires: user)
        allTechnicalApparatus(idTeam: ID): [TechnicalApparatus!] #@auth(requires: user)
        allTechnicalApparatusClub(idClub: ID): [TechnicalApparatus!] #@auth(requires: user)
    }

    extend type Mutation {
        createTechnicalApparatus(content: contentTechnicalApparatus!): TechnicalApparatus! # @auth(requires: user)

        updateTechnicalApparatus (id: ID!, idPerson: ID!, content: contentTechnicalApparatus!): statusUpdate @auth(requires: user)
        
        changeStatusTechnicalApparatus (id: ID!, status: String!, note: String): statusUpdate @auth(requires: user)
        
        deleteTechnicalApparatus ( id: ID! ): statusDelete @auth(requires: user)
    }

    type TechnicalApparatus {
        id:                     ID
        occupation:             String
        classification:         String
        membership_date:        Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        membership_date_end:    Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        paid:               Boolean
        testimony_experience:   String
        status:         String
        note:         String
        person:              Person
        team:               Team
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentTechnicalApparatus {
        id:                     ID
        occupation:             String
        classification:         String
        membership_date:        String
        membership_date_end:    String
        paid:               Boolean
        testimony_experience:   Upload
        person:             contentPerson
        id_team:            ID
    }
`;
