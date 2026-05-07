import {gql} from "@apollo/client";

export const AllLeaguesTeam = gql`
    query AllLeague($idTeam: ID) {
        allLeaguesTeam(idTeam: $idTeam) {
            id
            name
            numberTeams
            numberGroups
            description

            externalplayer 

            startDate
            expiryDate
            inscriptionStartDate
            inscriptionExpiryDate
            participatingTeams {
                id
                group
                
                league {
                    id
                    name
                }
                
                team {
                    id
                    name
                    category
                    club {
                        id
                        name
                    }
                }
                participatingTechnicalStaff {
                        id
                        technicalApparatus {
                            id
                            person {
                            first_name
                            second_name
                            third_name
                            tribe
                            }
                        }
                        }
                participatingPlayers {
                                id
                                number
                                player {
                                    id
                                    person {
                                    first_name
                                    second_name
                                    third_name
                                    tribe
                                    }
                                }
                                participatingPlayersMatches {
                                    id
                                    starter
                                    sub
                                    id_match {
                                    id
                                    }
                                }
                                }
                status
            }

            matchs {
                firstTeamParticipatingPlayersMatch {
                    id
                    starter
                    sub
                    id_participating_player {
                        id
                        number
                        player {
                        person {
                            first_name
                            second_name
                            third_name
                        }
                        }
                    }
                    }

                    secondTeamParticipatingPlayersMatch {
                    id
                    starter
                    sub
                    id_participating_player {
                        id
                        number
                        player {
                        person {
                            first_name
                            second_name
                            third_name
                        }
                        }
                    }
                    }
                id
                date
                firstTeamGoal
                secondTeamGoal
                type
                arbitre{
                    id
                    id_match
                    Arbitre1
                    Arbitre2
                    Arbitre4
                    Arbitre3
                
                }
                manOfMatch
                
                firstTeam {
                    id
                    team {
                        id
                        name
                    }
                }
                secondTeam {
                    id
                    team {
                        id
                        name
                    }
                }

                firstTeamCards {
                    id
                    type
                    player
                    date
                    team {
                        id
                        team {
                            id
                            name
                        }
                    }
                }
                
                secondTeamCards {
                    id
                    type
                    player
                    date
                    team {
                        id
                        team {
                            id
                            name
                        }
                    }
                }

                firstTeamScorersMatch {
                    id
                    time
                    participating_team {
                        id
                        team {
                            id
                            name
                        }
                    }
                    participating_player {
                        id
                        number

                        player {
                            id
                            player_center
                            person {
                                first_name
                                second_name
                                third_name
                                tribe
                            }
                        }
                    }
                }

                secondTeamScorersMatch {
                    id
                    time
                    participating_team {
                        id
                        team {
                            id
                            name
                        }
                    }
                    participating_player {
                        id
                        number

                        player {
                            id
                            player_center
                            person {
                                first_name
                                second_name
                                third_name
                                tribe
                            }
                        }
                    }
                }

                createdAt
                updatedAt
            }
            
            createdAt
            updatedAt
        }
    }
`;