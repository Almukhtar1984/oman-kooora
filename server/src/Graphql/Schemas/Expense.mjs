import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        expense(id: ID): Expense #@auth(requires: user)
        allExpensesClub(idClub: ID): [Expense!] #@auth(requires: user)
        allExpensesTeam(idTeam: ID): [Expense!] #@auth(requires: user)
    }

    extend type Mutation {
        createExpense (content: contentExpense!): Expense! #@auth(requires: user)

        updateExpense (id: ID!, content: contentExpense!): statusUpdate #@auth(requires: user)

        deleteExpense ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Expense {
        id:        ID

        value:     Float
        note:      String
        attachment:      String

        club:      Club
        team:      Team

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentExpense {
        value:     Float
        note:      String
        attachment: Upload

        id_club:   ID
        id_team:   ID
    }
`;
