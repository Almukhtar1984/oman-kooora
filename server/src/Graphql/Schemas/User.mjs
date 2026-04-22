import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        user(id: ID): User @auth(requires: user)
        allUser: [User!] @auth(requires: user)
        
        person(cardNumber: String): Person @auth(requires: user)

        currentUser: User! @auth(requires: user)
        refreshToken: AuthUser
    }

    extend type Mutation {
        authenticateUser(content: loginInfo): AuthUser!

        createUser(content: contentUser!): User! @auth(requires: user)

        addPersonImage (id: ID, image: Upload): Image @auth(requires: user)

        updateUser (id: ID!, content: contentUser!): statusUpdate @auth(requires: user)

        updateAnyUser (id: ID!, content: contentAnyUser!): statusUpdate @auth(requires: user)

        deleteUser ( id: ID! ): statusDelete @auth(requires: user)

        emailVerification(token: String): statusUpdate!
        resendVerificationEmail(email: String): statusUpdate!

        forgetPassword(email: String): statusUpdate!
        changePassword(content: contentChangePassword): statusUpdate!

        activeUser (id: ID!, activation: Boolean): statusUpdate! @auth(requires: user)
        logOut: statusDelete
    }

    type AuthUser {
        token: String!
        user:  User
    }

    input loginInfo {
        email:      String!
        password:   String!
    }

    type Image {
        url: String @imgUrl
    }
    
    type Person {
        id:                 ID
        personal_picture:   String #@imgUrl
        first_name:         String
        second_name:        String
        third_name:         String
        tribe:              String
        phone:              String
        card_number:        String
        date_birth:         String

        clubManagement:     ClubManagement
        team:           Team
        user:           User

        member:     Member
        player:     Player
        technicalApparatus:    TechnicalApparatus

        createdAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
        updatedAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
        deletedAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
    }

    type User {
        id:       ID
        person:   Person
        permission: Permission

        email:          String
        password:       String
        role:           String
        activation:     String
        email_verify:   String
        
        createdAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
        updatedAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
        deletedAt:  Date  @date(format: "dd/MM/yyyy HH:mm:ss")
    }

    input contentPerson {
        first_name:         String
        second_name:        String
        third_name:         String
        tribe:              String
        phone:              String
        card_number:        String
        date_birth:         String
    }

    input contentUser {
#        person:         contentPerson
        id_person:      String
        email:          String
        password:       String
        role:           String
        activation:     String
        email_verify:   String
    }
    
    input contentAnyUser {
        name:           String
        phone:          String
        email:          String
        newPassword:    String

        id_street:      [ID]
        id_service:     ID
    }

    input contentUpdateMyProfile {
        name:               String
        phone:              String
        email:              String

        password:           String
        newPassword:        String
    }

    input contentChangePassword {
        token:              String!
        password:           String!
        confirmPassword:    String!
    }
`;
