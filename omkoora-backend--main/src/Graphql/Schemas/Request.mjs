import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        request(id: ID): Request #@auth(requires: user)
        allRequests(idPlayer: ID, type: String): [Request!] #@auth(requires: user)
        allRequestsTeam(idTeam: ID): [Request!] #@auth(requires: user)
        authexternal(CardNumber: String, phoneNumber: String):Player
    }

    extend type Mutation {
        createRequest(content: contentRequest!): Request! #@auth(requires: user)

        updateRequest (id: ID!, content: contentRequest!): statusUpdate #@auth(requires: user)

        deleteRequest ( id: ID! ): statusDelete #@auth(requires: user)
        
        createRequestExternal(content: contentRequestExternal!): Request! @auth(requires: user)
    }

    type Request {
        id:         ID
        content:    String
        type:       String
        status:     String
        note:       String
        
        player:     Player

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentRequest {
        content:    String
        type:       String
        status:     String
        note:       String
        id_player:  ID
    }
    input contentRequestExternal {
        content: String
        type: String
        status: String
        note: String
        id_person: ID
  }
`;
