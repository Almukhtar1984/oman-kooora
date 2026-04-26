import {gql} from "@apollo/client";

export const ChangeMemberClassification = gql`
    mutation ChangeMemberClassification(
        $id: ID!,
        $fromType: String!,
        $toType: String!,
        $classification: String,
        $occupation: String,
        $job: String,
        $activity: String,
        $player_center: String,
        $class: String,
        $membership_date: String,
        $membership_date_end: String
    ) {
        changeMemberClassification(
            id: $id,
            fromType: $fromType,
            toType: $toType,
            classification: $classification,
            occupation: $occupation,
            job: $job,
            activity: $activity,
            player_center: $player_center,
            class: $class,
            membership_date: $membership_date,
            membership_date_end: $membership_date_end
        ) {
            id
        }
    }
`;
