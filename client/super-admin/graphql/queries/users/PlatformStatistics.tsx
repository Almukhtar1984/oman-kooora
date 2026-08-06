import { gql } from "@apollo/client";

// Aggregate-only platform statistics for the super-admin dashboard.
// Returns counts and grouped breakdowns exclusively — no personal data.
export const PlatformStatistics = gql`
    query PlatformStatistics {
        platformStatistics {
            clubs
            teams
            players
            members
            technicals
            boardManagement
            assembly
            stadiums
            leagues
            loans
            transfers
            viewers
            totalPeople
            activities { name count }
            ageCategories { name count }
            playersByStatus { name count }
            clubsByGovernorate { name count }
            usersByRole { name count }
            clubTotals {
                id
                name
                governorate
                teams
                players
                members
                technicals
                assembly
                board
                leagues
                stadiums
                loans
                transfers
                total
                activities { name count }
                ageCategories { name count }
            }
        }
    }
`;
