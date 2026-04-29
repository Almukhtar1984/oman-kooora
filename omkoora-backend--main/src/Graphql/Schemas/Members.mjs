import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        member(id: ID): Member #@auth(requires: user)
        allMembers(idTeam: ID): [Member!] #@auth(requires: user)
        allMembersHasAccount(idTeam: ID): [Member!] #@auth(requires: user)
        allMembersClub(idClub: ID): [Member!] #@auth(requires: user)
    }

    extend type Mutation {
        createMember(content: contentMember!): Member! #@auth(requires: user)
        
        createAdminMember(content: contentAdminMember!): Member! #@auth(requires: user)

        updateAdminMember(id: ID!, idPerson: ID!, content: contentAdminMember!): statusUpdate #@auth(requires: user)

        updateMember (id: ID!, idPerson: ID!, content: contentMember!): statusUpdate #@auth(requires: user)

        changeStatusMember (id: ID!, status: String!, note: String): statusUpdate #@auth(requires: user)
        
        deleteMember ( id: ID! ): statusDelete #@auth(requires: user)

        changeMemberClassification(
            id: ID!,
            fromType: String!,
            toType: String!,
            classification: String,
            occupation: String,
            job: String,
            activity: String,
            player_center: String,
            class: String,
            membership_date: String,
            membership_date_end: String
        ): Member
    }

    type Member {
        id:                 ID
        occupation:         String
        classification:     String
        status:             String
        note:               String
        membership_date:    Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        membership_date_end:    Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        paid:               Boolean
        person:             Person
        team:               Team
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentMember {
        occupation:         String
        classification:     String
        membership_date:    String
        membership_date_end:    String
        paid:               Boolean
        
        person:             contentPerson
        id_team:            ID
    }

    input contentAdminMember {
        occupation:         String
        classification:     String
        membership_date:    String
        membership_date_end:    String
        
        user:               contentUserAdminMember
        id_team:            ID
    }


    input contentUserAdminMember {
        person:         contentPerson
        email:          String
        password:       String
        role:           String
        activation:     String
        email_verify:   String
    }
    
`;
