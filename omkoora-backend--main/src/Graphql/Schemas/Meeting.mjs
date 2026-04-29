import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        meeting(id: ID): Meeting #@auth(requires: user)
        allMeetingsTeam(idTeam: ID): [Meeting!] #@auth(requires: user)
        allMeetingsClub(idClub: ID): [Meeting!] #@auth(requires: user)
    }

    extend type Mutation {
        createMeeting(content: contentMeeting!): Meeting! #@auth(requires: user)

        updateMeeting (id: ID!, content: contentMeeting!): statusUpdate #@auth(requires: user)

        deleteMeeting ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Meeting {
        id:                 ID
        subject:            String
        names_attending:    String
        description:        String
        attachment:       [Attachment]
        
        club:               Club
        team:               Team

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentMeeting {
        subject:            String
        names_attending:    String
        description:        String
        attachment:       [Upload]

        id_team:            ID
        id_club:            ID
    }

`;
