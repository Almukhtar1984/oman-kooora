import React, {useEffect, useMemo, useState} from 'react';
import './App.css';
import ListPlayers from "./components/PDF/ListPlayers";
import {useAllPlayersClub, useAllPlayersTeam, useAllPlayersClubByClass, useAllPlayersTeamByClass} from "./graphql";
import {useParams} from "react-router-dom";
import dayjs from 'dayjs';

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
        if (op !== undefined && op !== "" && age !== undefined && age !== "") {
            if (op !== "" && age !== "0") {
                return allPlayers.filter((item: any) => {
                    if (op === ">") {
                        return dayjs(item?.person?.date_birth).fromNow(true) >= age
                    } else {
                        return dayjs(item?.person?.date_birth).fromNow(true) <= age
                    }
                })
            }
        }

        return allPlayers;
    }, [age, allPlayers, op]);

    return (
        <ListPlayers players={filteredPlayers as any} />
    );
}
