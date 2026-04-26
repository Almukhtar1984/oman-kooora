import { gql } from "@apollo/client";

export const CountExternalPlayers = gql`
  query CountExternalPlayers($idTeam: ID!, $idLeague: ID!) {
    countExternalPlayers(idTeam: $idTeam, idLeague: $idLeague)
  }
`;
