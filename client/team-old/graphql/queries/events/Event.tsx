import { gql } from "@apollo/client";

export const ALL_EVENTS = gql`
    query AllEvents($idTeam: ID!) {
        allEvents(idTeam: $idTeam) {
            id
            name
            description
            date
            images
            imageList
            createdAt
        }
    }
`;

export const CREATE_EVENT = gql`
    mutation CreateEvent($content: contentEvent!) {
        createEvent(content: $content) {
            id
            name
        }
    }
`;

export const UPDATE_EVENT = gql`
    mutation UpdateEvent($id: ID!, $content: contentEvent!) {
        updateEvent(id: $id, content: $content) {
            status
        }
    }
`;

export const DELETE_EVENT = gql`
    mutation DeleteEvent($id: ID!) {
        deleteEvent(id: $id) {
            status
        }
    }
`;
