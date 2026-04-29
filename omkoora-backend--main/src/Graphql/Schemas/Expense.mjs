import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        expense(id: ID): Expense #@auth(requires: user)
        allExpensesClub(idClub: ID): [Expense!] #@auth(requires: user)
        allExpensesTeam(idTeam: ID): [Expense!] #@auth(requires: user)
        expenseSummary(idClub: ID, idTeam: ID): ExpenseSummary!
    }

    extend type Mutation {
        createExpense (content: contentExpense!): Expense! #@auth(requires: user)


        updateExpense (id: ID!, content: contentExpense!): statusUpdate #@auth(requires: user)

        updateSessionId(id: ID!, session_id: String!): statusUpdate


        deleteExpense ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Expense {
        id:        ID

        value:     Float
        note:      String
        attachment:      String
        user: String
        club:      Club
        team:      Team
        session_id: String
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentExpense {
        value:     Float
        note:      String
        attachment: Upload
        session_id: String
        user: String
        id_club:   ID
        id_team:   ID
    }
    input contentExpenseThawani {
        value:     Float
        note:      String
        session_id: String
        user: String
        id_club:   ID
        id_team:   ID
    }

    type ExpenseSummary {
        profits: Float
        expenses: Float
        net: Float
    }
`;
