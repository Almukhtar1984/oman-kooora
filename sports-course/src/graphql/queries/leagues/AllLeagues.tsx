import {gql} from "@apollo/client";

export const AllLeagues = gql`
    query AllLeague($idClub: ID) {
        allLeagues(idClub: $idClub) {
            id
            name
            numberTeams
            numberGroups
            description

            startDate
            expiryDate

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
            }

            matchs {
                id
                date
                firstTeamGoal
                secondTeamGoal
                type

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