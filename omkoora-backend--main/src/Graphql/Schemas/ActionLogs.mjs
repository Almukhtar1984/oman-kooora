import {gql} from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        ActionLog(id: ID!): ActionLog #@auth(requires: user)
        allActionLogs: [ActionLog!] @auth(requires: user)
        allActionLogsClub(idClub: ID!): [ActionLog!] @auth(requires: user)
    }


    type ActionLog {
        id: ID!
        id_player: ID
        level: String
        action_name: String
        success: String
        user: User
        entity_type: String
        entity_id: ID
        action_type: ActionType
        action_variables: String
        team: Team
        createdAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
        updatedAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
        deletedAt: Date @date(format: "dd/MM/yyyy HH:mm:ss")
    }



    enum ActionType {
        Create
        Update
        Delete
    }

    type statusDelete {
        success: Boolean!
        message: String
    }
`;