import { gql } from "@apollo/client";

export const GetPerson = gql`
    query GetPersone($cardNumber: String) {
        person(cardNumber: $cardNumber) {
            first_name
            second_name
            third_name
            tribe
            phone
            card_number
            date_birth
            member {
                occupation
                classification
                status
                note
                membership_date
                membership_date_end
                paid
            }
            player {
                activity
                player_center
                job
                nationalID
                nationalIDBack
                parentApproval
                status
                note
            }
            technicalApparatus {
                occupation
                classification
                membership_date
                membership_date_end
                paid
                testimony_experience
                status
                note
            }
        }
    }
`;