import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        request(id: ID): Request @auth(requires: user)
        allRequests(idPlayer: ID, type: String): [Request!] @auth(requires: user)
        allRequestsTeam(idTeam: ID): [Request!] @auth(requires: user)
        authexternal(CardNumber: String, phoneNumber: String):Player

        # The signed-in member's own requests & complaints — for the portal.
        # Deliberately NOT @auth(requires: user): a portal token identifies a
        # person, not a dashboard account, so this reads context.portalPerson
        # itself (same pattern as portalMe / portalPayments). A dashboard account
        # linked to a player sees that player's requests too.
        portalRequests: [Request!]
    }

    extend type Mutation {
        createRequest(content: contentRequest!): Request! @auth(requires: user)

        updateRequest (id: ID!, content: contentRequest!): statusUpdate @auth(requires: user)

        deleteRequest ( id: ID! ): statusDelete @auth(requires: user)
        
        createRequestExternal(content: contentRequestExternal!): Request! @auth(requires: user)
    }

    type Request {
        id:         ID
        content:    String
        type:       String
        status:     String
        note:       String

        # Human-friendly reference the member quotes when following up.
        reference_number: String
        # The admin's reply and when it was sent.
        admin_reply:      String
        replied_at:       Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        # Files the member attached to the request.
        attachments:      [Attachment]

        player:     Player

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    # Documented value sets for the client. The Request.type / status columns
    # stay plain strings server-side (type keeps its own DB enum).
    enum PortalRequestType { request, complaint }
    enum PortalRequestStatus { new, review, replied, closed, rejected }

    input contentRequest {
        content:    String
        type:       String
        status:     String
        note:       String
        # Admin reply — setting it stamps replied_at automatically.
        admin_reply: String
        attachments: [Upload]
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
