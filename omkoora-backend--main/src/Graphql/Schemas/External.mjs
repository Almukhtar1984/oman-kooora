import { gql } from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        Home: Home #@auth(requires: user)
    }

    type Home { 
        Match: [Match]  # Today's match 
        Blog: [Blog]  # Last 10 blogs
        League: [League]
    }


    # Include other types, inputs, and mutations as in your existing schema...
`;