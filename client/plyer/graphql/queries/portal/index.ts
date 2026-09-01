import { gql } from "@apollo/client";

// Sign in with the phone number and civil ID the club already has on file —
// no email account needed.
export const AUTHENTICATE_PORTAL_PERSON = gql`
    mutation AuthenticatePortalPerson($phone: String!, $card_number: String!) {
        authenticatePortalPerson(phone: $phone, card_number: $card_number) {
            token
            person {
                id
                first_name
                second_name
                third_name
                tribe
            }
        }
    }
`;

// Everything the signed-in member is allowed to see about themselves. Takes no
// id: the server reads the person from the token.
export const PORTAL_ME = gql`
    query PortalMe {
        portalMe {
            person {
                id
                personal_picture
                first_name
                second_name
                third_name
                tribe
                phone
                card_number
                date_birth
            }
            memberships {
                kind
                id
                status
                class
                occupation
                classification
                membership_date
                team {
                    id
                    name
                    logo
                }
                club {
                    id
                    name
                    logo
                }
            }
            assemblies {
                id
                membership_number
                membership_date
                subscription_date
                type
            }
        }
    }
`;

export const PORTAL_PAYMENTS = gql`
    query PortalPayments {
        portalPayments {
            totalPaid
            payments {
                id
                amount
                note
                payment_date
                paid_as
                createdAt
                team {
                    id
                    name
                }
            }
        }
    }
`;
