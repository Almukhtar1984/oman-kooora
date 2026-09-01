import {gql} from "apollo-server-express";

// The member portal (player.omkooora.com). Anyone recorded in the system — a
// player, a board member, technical staff or a general-assembly member — signs
// in with their phone number and civil ID and sees only their own record.
//
// These queries deliberately take NO id argument: the person is read from the
// portal token, so one member can never ask for another member's data. They are
// also NOT behind `@auth(requires: user)` — a portal token is not a dashboard
// account and must not unlock the rest of the API. Each resolver checks
// `context.portalPerson` itself.
export const typeDefs = gql`

    extend type Query {
        portalMe: PortalMe
        portalPayments: PortalAccount
    }

    extend type Mutation {
        authenticatePortalPerson(phone: String!, card_number: String!): PortalAuth!
    }

    type PortalAuth {
        token:  String!
        person: Person!
    }

    type PortalMe {
        person:      Person!
        # One entry per capacity the person is registered in. Most people have
        # exactly one; someone can be both a player and technical staff.
        memberships: [PortalMembership!]!
        # The clubs whose general assembly lists this person, matched by civil ID.
        assemblies:  [Assembly!]!
    }

    type PortalMembership {
        # "player" | "member" | "technical"
        kind:           String!
        id:             ID
        status:         String
        class:          String
        occupation:     String
        classification: String
        membership_date: String
        team:           Team
        club:           Club
    }

    type PortalAccount {
        totalPaid: Float!
        payments:  [PortalPayment!]!
    }

    type PortalPayment {
        id:           ID
        amount:       Float
        note:         String
        payment_date: String
        createdAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
        team:         Team
        # Which membership the payment was recorded against: "player" or "member".
        paid_as:      String
    }
`;
