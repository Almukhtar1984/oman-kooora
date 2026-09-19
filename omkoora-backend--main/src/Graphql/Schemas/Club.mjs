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

        # حقول صفحة النادي في تطبيق الموبايل
        founded_year:           String        # سنة التأسيس (تُدخل يدويًا)
        president_name:         String        # رئيس النادي = مدير النادي (club_managements.role = 1)
        head_coach_name:        String        # المدرب الأول في فرق النادي
        affiliated_team_label:  String        # الفريق الأساسي: "الفريق الأول" إن وُجد وإلا أقدم فريق
        star_players:           [StarPlayer]  # يُشتقّ من الهدّافين، وإلا من اللاعبين المعتمدين

        admin:          User
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type StarPlayer {
        id:             ID
        name:           String
        position_label: String   # مركز اللاعب (مهاجم / وسط / دفاع / حارس)
        number:         String   # رقم القميص (يُدخل يدويًا، قد يكون فارغًا)
        goals:          Int      # عدد الأهداف المسجَّلة (0 إن لم يكن هدّافًا)
    }

    input contentClub {
        name:           String
        governorate:    String
        logo:           Upload
        phone:          String
        account_status: Boolean
        founded_year:   String
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
