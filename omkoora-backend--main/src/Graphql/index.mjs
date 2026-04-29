import { makeExecutableSchema } from '@graphql-tools/schema';
import {gql} from "apollo-server-express";
import { GraphQLScalarType, Kind } from 'graphql';
import {TimeResolver} from 'graphql-scalars';

import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs"

import {
    resolversUser,
    resolversClub,
    resolversTeam,
    resolversMembers,
    resolversPlayers,
    resolversTechnicalApparatus,
    resolversClubManagement,
    resolversTransfer,
    resolversRequest,
    resolversAssembly,
    resolversMessage,
    resolversExpense,
    resolversMeeting,
    resolversBlog,
    resolversForm,
    resolversPermission,
    resolversStadium, 
    resolversLeague,
    resolversSanction,
    resolversActionLogs,
    resolversNotification,
    resolversExternal,
    resolversStat,
    resolversEvent
     
} from "./Resolvers/index.mjs"

import {
    typeDefsUser,
    typeDefsClub,
    typeDefsTeam,
    typeDefsMembers,
    typeDefsPlayers,
    typeDefsTechnicalApparatus,
    typeDefsClubManagement,
    typeDefsTransfer,
    typeDefsRequest,
    typeDefsAssembly,
    typeDefsMessage,
    typeDefsExpense,
    typeDefsMeeting,
    typeDefsBlog,
    typeDefsForm,
    typeDefsPermission,
    typeDefsStadium, 
    typeDefsLeague,
    typeSanction,
    typeActionLogs,
    typeNotification,
    typeExternal ,
    typeStat,
    typeDefsEvent
    
    
} from "./Schemas/index.mjs"

import {dateDirectiveTransformer, authDirectiveTransformer, imgUrlDirectiveTransformer} from "./Directives/index.mjs"

const typeDefs = gql`
    directive @date(format: String = "dd/mm/yyyy HH:MM:ss") on FIELD_DEFINITION
    directive @auth( requires: Role = user ) on OBJECT | FIELD_DEFINITION
    directive @imgUrl on FIELD_DEFINITION

    scalar Date
    scalar Upload
    scalar Time

    type File {
        filename:   String!
        url:        String!
    }

    type Files {
        filesname:   [String!]
        url:        String!
    }

    enum Role {
        admin
        employee
        supervisor
        customer
        user
    }

    enum Gander {
        male
        female
    }

    enum Activation {
        Active
        Desactive
    }


    type Query {
        _empty: String
    }

    type Mutation {
        _empty: String
        singleUpload(file: Upload): File
    }

    type statusUpdate {
        status: Boolean
    }

    type statusDelete {
        status: Boolean
    }
`;

const resolvers = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) { return new Date(value); },
        serialize(value) { return value; },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) { return parseInt(ast.value, 10); }
            return null;
        },
    }),

    Time: TimeResolver,

    Upload: GraphQLUpload
}

let schema = makeExecutableSchema({
    typeDefs: [
        typeDefs, typeDefsUser, typeDefsClub, typeDefsTeam, typeDefsMembers, typeDefsPlayers, typeDefsTechnicalApparatus, typeDefsBlog,
        typeDefsClubManagement, typeDefsTransfer, typeDefsRequest, typeDefsAssembly, typeDefsMessage, typeDefsExpense, typeDefsMeeting,
        typeDefsForm, typeDefsPermission, typeDefsStadium, typeDefsLeague,typeSanction,typeActionLogs,typeNotification,typeExternal,typeStat,
        typeDefsEvent
    ],
    resolvers: [
        resolvers, resolversUser, resolversClub, resolversTeam, resolversMembers, resolversPlayers, resolversTechnicalApparatus, resolversBlog,
        resolversClubManagement, resolversTransfer, resolversRequest, resolversAssembly, resolversMessage, resolversExpense, resolversMeeting,
        resolversForm, resolversPermission, resolversStadium, resolversLeague,resolversSanction,resolversActionLogs,resolversNotification,resolversExternal,resolversStat,
        resolversEvent
    ],
});
 
schema = dateDirectiveTransformer(schema)
schema = authDirectiveTransformer(schema)
schema = imgUrlDirectiveTransformer(schema)

export default schema



