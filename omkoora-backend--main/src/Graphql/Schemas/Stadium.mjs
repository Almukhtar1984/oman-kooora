import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        stadium(id: ID): Stadium #@auth(requires: user)
        allStadiumsTeam(idTeam: ID): [Stadium!] @auth(requires: user)
        allStadiums: [Stadium!] #@auth(requires: user)
        allReservations(idStadium: ID): [Reservations]
        reservationsByTeam(idTeam: ID!): [Reservations!]
        # كل فترات اليوم مع حالتها وسعرها (كانت ترجع نصوص الأوقات المتاحة فقط).
        availableTimeSlots(idStadium: ID!, booking_date: String!): [TimeSlot!]
    }

    extend type Mutation {
        createStadium(content: contentStadium!): Stadium! #@auth(requires: user)

        updateStadium (id: ID!, content: contentStadium!): statusUpdate #@auth(requires: user)

        deleteStadium ( id: ID! ): statusDelete #@auth(requires: user)

        createReservations(content: contentReservations!): Reservations! #@auth(requires: user)
        # New mutation to update reservation status
        updateReservationStatus(id: ID!, status: String!): statusUpdate @auth(requires: user)
        
        # New mutation to delete a reservation
        deleteReservation(id: ID!): statusDelete @auth(requires: user)
    }

    type TimeSlot {
        label:        String
        start_time:   String
        end_time:     String
        is_available: Boolean
        price:        Float      # سعر الفترة = rent (سعر الساعة) × مدة الفترة
    }

    type Stadium {
        id:         ID
        name:          String
        about:          String
        type:           String
        attachments:    String
        rent:           Float
        images:         String
        mohafada:       String
        wiliya:         String
        team:           Team
        sport:          String
        end_time:       String
        start_time:     String

        badge_label:         String   # بادج الملعب
        features_label:      String   # مميزات الملعب
        min_booking_minutes: Int      # الحد الأدنى لمدة الحجز (افتراضي 60)

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
        start_time:   String
        end_time:    String
        mohafada:   String
        wiliya:     String
        images:         [Upload]

        badge_label:         String
        features_label:      String
        min_booking_minutes: Int

        id_team:        ID
    }

    type Reservations {
        id:             ID
        full_name:      String   # اسم صاحب الحجز
        phone:          String
        booking_date:   Date
        booking_start:  String
        booking_end:    String

        stadium:        Stadium
        status:         String

        duration_minutes: Int     # مدة الحجز بالدقائق (تُحسب من وقتي البداية والنهاية)
        total_price:      Float   # السعر الإجمالي = rent (سعر الساعة) × مدة الحجز
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentReservations {
        full_name:      String
        phone:          String
        booking_date:   String
        booking_start:  String
        booking_end:    String

        id_stadium:     ID
    }
`;
