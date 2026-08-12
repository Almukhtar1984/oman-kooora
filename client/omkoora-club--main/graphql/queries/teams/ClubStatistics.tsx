import { gql } from "@apollo/client";

// Aggregate-only statistics scoped to the logged-in club.
// No names or personal data — counts and breakdowns only.
export const ClubStatistics = gql`
    query ClubStatistics($idClub: ID) {
        clubStatistics(idClub: $idClub) {
            club
            governorate
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
            totalPeople
            activities { name count }
            ageCategories { name count }
            playersByStatus { name count }
        }
    }
`;
