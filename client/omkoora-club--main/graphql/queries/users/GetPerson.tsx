import { gql } from "@apollo/client";

export const GetPerson = gql`
    query GetPersone($cardNumber: String) {
        person(cardNumber: $cardNumber) {
            id
            personal_picture
            first_name
            second_name
            third_name
            tribe
            phone
            card_number
            date_birth
            member {
                id
                occupation
                classification
                status
                note
                membership_date
                membership_date_end
                paid
                team {
                    id
                    name
                    club {
                        id
                        name
                    }
                }
            }
            player {
                id
                activity
                player_center
                job
                nationalID
                nationalIDBack
                parentApproval
                status
                note
                team {
                    id
                    name
                    club {
                        id
                        name
                    }
                }
            }
            technicalApparatus {
                id
                occupation
                classification
                membership_date
                membership_date_end
                paid
                testimony_experience
                status
                note
                team {
                    id
                    name
                    club {
                        id
                        name
                    }
                }
            }
        }
    }
`;