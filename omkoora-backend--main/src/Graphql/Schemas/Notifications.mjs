import {gql} from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        allNotificationClub(idClub: ID!): [Notification] #@auth(requires: user)
        allNotificationTeam(idTeam: ID!): [Notification] #@auth(requires: user)
    }

    extend type Mutation {
        markNotificationsAsRead(idClub: ID, idTeam: ID): Boolean #@auth(requires: user)
    }


    type Notification {
        id: ID!
        body: String
        isRead: Boolean
        createdAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
        updatedAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
        deletedAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
    }





`;