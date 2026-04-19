import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        stadium(id: ID): Stadium #@auth(requires: user)
        allStadiumsTeam(idTeam: ID): [Stadium!] #@auth(requires: user)
        allStadiums: [Stadium!] #@auth(requires: user)
        allReservations(idStadium: ID): [Reservations]
    }

    extend type Mutation {
        createStadium(content: contentStadium!): Stadium! #@auth(requires: user)

        updateStadium (id: ID!, content: contentStadium!): statusUpdate #@auth(requires: user)

        deleteStadium ( id: ID! ): statusDelete #@auth(requires: user)


        createReservations(content: contentReservations!): Reservations! #@auth(requires: user)
    }

    type Stadium {
        id:         ID
        name:          String
        about:          String
        type:           String
        attachments:    String
        rent:           Float
        
        images:         String

        team:           Team
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentStadium {
        name:          String
        about:          String
        type:           String
        attachments:    String
        rent:           Float
        
        images:         [Upload]

        id_team:        ID
    }

    type Reservations {
        id:             ID
        phone:          String
        booking_date:   Date
        booking_start:  String
        booking_end:    String

        stadium:        Stadium

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentReservations {
        phone:          String
        booking_date:   String
        booking_start:  String
        booking_end:    String

        id_stadium:     ID
    }
`;
