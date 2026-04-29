import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        assembly(id: ID): Assembly #@auth(requires: user)
        allAssemblyClub(idClub: ID): [Assembly!] #@auth(requires: user)
        allAssemblyTeam(idTeam: ID): [Assembly!] #@auth(requires: user)
    }

    extend type Mutation {
        createAssembly(content: contentAssembly!): Assembly! @auth(requires: user)

        updateAssembly (id: ID!, content: contentAssembly!): statusUpdate @auth(requires: user)

        deleteAssembly ( id: ID! ): statusDelete @auth(requires: user)
    }

    type Assembly {
        id:                 ID
        personal_picture:   String
        first_name:         String
        second_name:        String
        third_name:         String
        tribe:              String
        date_birth:         Date @date(format: "yyyy-MM-dd")
        card_number:        String
        phone:              String
        type:               String

        club:               Club
        team:               Team

        nationalID:         String
        nationalIDBack:     String
        
        membership_date:    Date @date(format: "yyyy-MM-dd")
        gender:             Gander
        subscription_date:  Date @date(format: "yyyy-MM-dd")

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentAssembly {
        personal_picture:   Upload
        oldPersonalPicture: String
        first_name:         String
        second_name:        String
        third_name:         String
        tribe:              String
        date_birth:         String
        card_number:        String
        phone:              String
        type:               String

        nationalID:         Upload
        nationalIDBack:     Upload
        oldNationalID:      String
        oldNationalIDBack:  String

        membership_date:    String
        gender:             Gander
        subscription_date:  String

        id_club:            ID
        id_team:            ID
    }
`;
