import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        allCommittees(idClub: ID): [Committee!] @auth(requires: user)
        committee(id: ID!): Committee @auth(requires: user)
    }

    extend type Mutation {
        createCommittee(idClub: ID, name: String!): Committee! @auth(requires: user)
        updateCommittee(id: ID!, name: String!): statusUpdate @auth(requires: user)
        deleteCommittee(id: ID!): statusDelete @auth(requires: user)

        createCommitteeMember(idCommittee: ID!, name: String!, phone: String): CommitteeMember! @auth(requires: user)
        updateCommitteeMember(id: ID!, name: String, phone: String, idCommittee: ID): statusUpdate @auth(requires: user)
        deleteCommitteeMember(id: ID!): statusDelete @auth(requires: user)
    }

    type Committee {
        id:           ID
        name:         String
        membersCount: Int
        members:      [CommitteeMember]
        club:         Club
        createdAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type CommitteeMember {
        id:        ID
        name:      String
        phone:     String
        committee: Committee
        createdAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }
`;
