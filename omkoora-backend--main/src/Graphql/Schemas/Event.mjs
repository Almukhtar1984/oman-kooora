import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        allEvents(idTeam: ID!): [Event!]
        event(id: ID!): Event
    }

    extend type Mutation {
        createEvent(content: contentEvent!): Event!
        updateEvent(id: ID!, content: contentEvent!): statusUpdate
        deleteEvent(id: ID!): statusDelete
    }

    type Event {
        id:          ID
        name:        String
        description: String
        date:        Date @date(format: "yyyy-MM-dd")
        images:      String
        imageList:   [String]
        team:        Team
        createdAt:   Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:   Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentEvent {
        name:          String
        description:   String
        date:          String
        images:        [Upload]
        id_team:       ID
        deletedImages: [String]
    }
`;
