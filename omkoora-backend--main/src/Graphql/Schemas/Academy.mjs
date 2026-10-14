import {gql} from "apollo-server-express";

// Academies module — standalone units with their own owner login (role 7),
// mirroring the stadium-owner module. Additive & non-breaking.
//
//   PUBLIC (no token): the mobile app lists academies, their programs and news,
//   contact numbers, and submits a registration (createAcademyRegistration).
//   OWNER (@auth, role 7): my* queries + management mutations, all scoped to
//   the signed-in owner's own academies.
export const typeDefs = gql`

    extend type Query {
        # ---- Public (mobile app, no token) ----
        academies: [Academy!]
        academy(id: ID!): Academy
        academyPrograms(idAcademy: ID!): [AcademyProgram!]
        academyNews(idAcademy: ID!): [AcademyNews!]
        # Every academy's news together, newest first — the app news page.
        allAcademyNews: [AcademyNews!]

        # ---- Owner dashboard (role 7, @auth) ----
        myAcademies: [Academy!] @auth(requires: user)
        myAcademyPrograms: [AcademyProgram!] @auth(requires: user)
        myAcademyNews: [AcademyNews!] @auth(requires: user)
        # status: optional filter ("waiting" | "accepted" | "rejected").
        myAcademyRegistrations(status: String): [AcademyRegistration!] @auth(requires: user)
        # Simple report: registration counts per program for the owner.
        myAcademyReport: [AcademyProgramReport!] @auth(requires: user)
    }

    extend type Mutation {
        # Super-admin (role 1) creates or resets an academy-owner account (role 7).
        provisionAcademyOwner(email: String!, password: String!): User! @auth(requires: user)

        # ---- Owner management (role 7, @auth) ----
        createAcademy(content: contentAcademy!): Academy! @auth(requires: user)
        updateAcademy(id: ID!, content: contentAcademy!): statusUpdate @auth(requires: user)
        deleteAcademy(id: ID!): statusDelete @auth(requires: user)

        createAcademyProgram(content: contentAcademyProgram!): AcademyProgram! @auth(requires: user)
        updateAcademyProgram(id: ID!, content: contentAcademyProgram!): statusUpdate @auth(requires: user)
        deleteAcademyProgram(id: ID!): statusDelete @auth(requires: user)

        createAcademyNews(content: contentAcademyNews!): AcademyNews! @auth(requires: user)
        updateAcademyNews(id: ID!, content: contentAcademyNews!): statusUpdate @auth(requires: user)
        deleteAcademyNews(id: ID!): statusDelete @auth(requires: user)

        # Owner accepts/rejects a registration, or records a (cash) payment.
        updateAcademyRegistrationStatus(id: ID!, status: String!): statusUpdate @auth(requires: user)
        updateAcademyRegistrationPayment(id: ID!, payment_status: String!, note: String): statusUpdate @auth(requires: user)

        # ---- Public (mobile app, no token) ----
        # A parent registers a child from the app → notification to the owner.
        createAcademyRegistration(content: contentAcademyRegistration!): AcademyRegistration!
    }

    type Academy {
        id:        ID
        name:      String
        about:     String
        logo:      String
        images:    String
        phone:     String
        email:     String
        mohafada:  String
        wiliya:    String
        id_user:   ID
        owner:     User
        programs:  [AcademyProgram!]
        news:      [AcademyNews!]
        createdAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type AcademyProgram {
        id:           ID
        name:         String
        age_category: String
        schedule:     String
        about:        String
        price:        Float
        id_academy:   ID
        academy:      Academy
        createdAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:    Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type AcademyNews {
        id:         ID
        title:      String
        body:       String
        image:      String
        id_academy: ID
        academy:    Academy
        createdAt:  Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type AcademyRegistration {
        id:               ID
        full_name:        String
        phone:            String
        child_birth_date: String
        age:              Int
        status:           String
        payment_status:   String
        note:             String
        id_academy:       ID
        id_program:       ID
        academy:          Academy
        program:          AcademyProgram
        createdAt:        Date @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:        Date @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type AcademyProgramReport {
        id_program:   ID
        program_name: String
        total:        Int
        waiting:      Int
        accepted:     Int
        rejected:     Int
    }

    input contentAcademy {
        name:     String
        about:    String
        phone:    String
        email:    String
        mohafada: String
        wiliya:   String
        logo:     Upload
        images:   [Upload]
        # Super-admin may assign the academy to an owner account here; owners
        # creating their own academy leave it blank (it defaults to themselves).
        id_user:  ID
    }

    input contentAcademyProgram {
        name:         String
        age_category: String
        schedule:     String
        about:        String
        price:        Float
        id_academy:   ID
    }

    input contentAcademyNews {
        title:      String
        body:       String
        image:      Upload
        id_academy: ID
    }

    input contentAcademyRegistration {
        full_name:        String
        phone:            String
        child_birth_date: String
        age:              Int
        note:             String
        id_academy:       ID
        id_program:       ID
    }
`;
