import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        transfer(id: ID): Transfer @auth(requires: user)
        allTransfer(idClub: ID): [Transfer!] @auth(requires: user)
        allTransferTeam(idTeam: ID, transitionType: [String]): [Transfer!] @auth(requires: user)
        
        allTransferClub(idClub: ID): [Transfer!] @auth(requires: user)
    }

    extend type Mutation {
        createTransfer(content: contentTransfer!): Transfer! @auth(requires: user)

        updateTransfer (id: ID!, content: contentTransfer!): statusUpdate @auth(requires: user)

        deleteTransfer ( id: ID! ): statusDelete @auth(requires: user)
        
        BackToOldTeamTransfer ( id: ID! ): statusDelete @auth(requires: user)

        updateLoan(id: ID!, date_start: String, date_end: String): Transfer! @auth(requires: user)
    }

    type Transfer {
        id:           ID
        status:       String   # waiting_club_from | waiting_club_to | accepted | rejected | waiting(legacy)
        type:         String
        team_from:    Team
        team_to:      Team
        club_from:    Club      # the player's own club — first approver in the chain
        club_to:      Club
        id_player:    ID
        player:       Player

        # Set instead of id_player when the transfer/loan moves a technical-staff member.
        id_technical_apparatus: ID
        technicalApparatus:     TechnicalApparatus

        transition_type:  String
        date_end:         Date  @date(format: "yyyy-MM-dd")
        date_start:       Date  @date(format: "yyyy-MM-dd")

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentTransfer {
        status:       String
        type:         String

        transition_type:  String
        date_end:         String
        date_start:       String
        
        id_team_from: ID
        id_team_to:   ID
        id_player:    ID
        id_technical_apparatus: ID
        id_club_to:   ID
        id_club_from: ID

        # سبب الرفض — لا يُخزَّن في سجلّ الانتقال، بل يُكتب في خطّ تتبّع الطلب
        # كي يعرف الفريق لماذا رُفض طلبه.
        note:         String
    }
`;
