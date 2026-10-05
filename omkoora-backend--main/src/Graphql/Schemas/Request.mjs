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

        # Same as portalRequests with an optional type filter
        # ("request" | "complaint"); omit type to get both. Portal token (or a
        # linked dashboard account) — NOT @auth(requires: user), see above.
        portalMyRequests(type: String): [Request!]
    }

    extend type Mutation {
        createRequest(content: contentRequest!): Request! @auth(requires: user)

        updateRequest (id: ID!, content: contentRequest!): statusUpdate @auth(requires: user)

        deleteRequest ( id: ID! ): statusDelete @auth(requires: user)

        createRequestExternal(content: contentRequestExternal!): Request! @auth(requires: user)

        # A portal member files their own request/complaint. The person is read
        # from the token (never the client); only content/type/note/attachments
        # are honoured. NOT @auth(requires: user) — portal token, see queries.
        portalCreateRequest(content: contentRequest!): Request!
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
