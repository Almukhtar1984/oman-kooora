import React, {useEffect, useMemo, useState} from 'react';
import './App.css';
import ListPlayers from "./components/PDF/ListPlayers";
import {useAllPlayersClub, useAllPlayersTeam, useAllPlayersClubByClass, useAllPlayersTeamByClass} from "./graphql";
import {useParams} from "react-router-dom";
import dayjs from 'dayjs';

// Exported for tests: computes a player's whole-year age from their date_birth.
// Returns null when the date is missing or unparseable so callers can decide
// how to treat such entries (we keep them in the result set).
export const computeAgeYears = (dateBirth?: string): number | null => {
    if (!dateBirth) return null;
    const parsed = dayjs(dateBirth);
    if (!parsed.isValid()) return null;
    return dayjs().diff(parsed, "year");
};

// Exported for tests: returns true when a player matches the (op, age) filter.
// `op` is ">" or "<"; `age` is a numeric string from the URL. Missing/zero age
// disables the filter (everyone passes).
export const matchesAgeFilter = (
    player: any,
    op?: string,
    age?: string,
): boolean => {
    if (!op || !age || age === "0") return true;
    const ageNumber = parseInt(age, 10);
    if (!Number.isFinite(ageNumber)) return true;

    const playerAge = computeAgeYears(player?.person?.date_birth);
    if (playerAge === null) return true; // keep unknown-age players visible

    if (op === ">") return playerAge >= ageNumber;
    if (op === "<") return playerAge <= ageNumber;
    return true;
};

export default function Players() {
    const {id, type, className, op, age} = useParams()
    const [getAllPlayersTeam] = useAllPlayersTeam();
    const [getAllPlayersClub] = useAllPlayersClub();
    const [getAllPlayersTeamByClass] = useAllPlayersTeamByClass();
    const [getAllPlayersClubByClass] = useAllPlayersClubByClass();
    const [allPlayers, setAllPlayers] = useState([]);

    useEffect(() => {
        if (id && id !== "") {
            if (className && ["young", "rookies", "secondDegree", "firstDegree"].includes(className)) {
                if (type && type === "team") {
                    getAllPlayersTeamByClass({
                        variables: {idTeam: id, className},
                        fetchPolicy: "network-only",
                        onCompleted: ({allPlayersByClass}) => {
                            setAllPlayers(allPlayersByClass)
                        }
                    })
                } else if (type && type === "club"){
                    getAllPlayersClubByClass({
                        variables: {idClub: id, className},
                        fetchPolicy: "network-only",
                        onCompleted: ({allPlayersClubByClass}) => {
                            setAllPlayers(allPlayersClubByClass)
                        }
                    })
                }
            } else {
                if (type && type === "team") {
                    getAllPlayersTeam({
                        variables: {idTeam: id},
                        fetchPolicy: "network-only",
                        onCompleted: ({allPlayers}) => {
                            setAllPlayers(allPlayers)
                        }
                    })
                } else if (type && type === "club"){
                    getAllPlayersClub({
                        variables: {idClub: id},
                        fetchPolicy: "network-only",
                        onCompleted: ({allPlayersClub}) => {
                            setAllPlayers(allPlayersClub)
                        }
                    })
                }
            }
        }
    }, [
        className,
        getAllPlayersClub,
        getAllPlayersClubByClass,
        getAllPlayersTeam,
        getAllPlayersTeamByClass,
        id,
        type,
    ])

    const filteredPlayers = useMemo(() => {
        return allPlayers.filter((item: any) => matchesAgeFilter(item, op, age));
    }, [age, allPlayers, op]);

    return (
        <ListPlayers players={filteredPlayers as any} />
    );
}
