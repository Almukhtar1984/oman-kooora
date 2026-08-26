import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        club(id: ID): Club @auth(requires: user)
        allClub: [Club!] #@auth(requires: user)
    }

    extend type Mutation {
        createClub(content: contentClub!): Club! @auth(requires: user)

        updateClub (id: ID!, content: contentClub!): statusUpdate @auth(requires: user)

        deleteClub ( id: ID! ): statusDelete @auth(requires: user)
        uploadPlayersSheet(teamId: ID!, file: Upload!): UploadPlayersSheetResult!
        # Import a club membership register (الجمعية العمومية) from an Excel file.
        # Robust: maps columns by header name, splits Arabic names, and
        # preserves the club's own membership number (رقم العضوية).
        uploadAssemblySheet(idClub: ID!, file: Upload!): UploadAssemblySheetResult! @auth(requires: user)

    }

    type Club {
        id:             ID
        name:           String
        governorate:    String
        logo:           String @imgUrl
        phone:          String
        account_status: Boolean

        teams:          [Team]
        
        admin:          User
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentClub {
        name:           String
        governorate:    String
        logo:           Upload
        phone:          String
        account_status: Boolean
    }
type UploadPlayersSheetResult {
  numberOfPersonCreated: Int!
  numberOfPersonRefused: Int!
  created: Int
  duplicates: Int
  failed: Int
  total: Int
}

type UploadAssemblySheetResult {
  created: Int!
  skipped: Int!
  duplicates: Int!
  totalRows: Int!
  message: String
}

`;
