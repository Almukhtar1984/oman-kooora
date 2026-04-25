import React, {useEffect, useState} from 'react';
import './App.css';
import ListTechnicals from "./components/PDF/ListTechnicals";
import {useAllTechnicals} from "./graphql";
import {useParams} from "react-router-dom";

export default function Technicals() {
    const {id, type} = useParams()
    const [getAllTechnicals] = useAllTechnicals();
    // const [getAllPlayersClub] = useAllPlayersClub();
    const [allTechnicals, setAllTechnicals] = useState([]);

    useEffect(() => {
        if (id && id !== "") {
            if (type && type === "team") {
                getAllTechnicals({
                    variables: {idTeam: id},
                    fetchPolicy: "network-only",
                    onCompleted: ({allTechnicalApparatus}: any) => {
                        setAllTechnicals(allTechnicalApparatus)
                    }
                })
            } // else if (type && type === "club"){
            //     getAllPlayersClub({
            //         variables: {idClub: id},
            //         fetchPolicy: "network-only",
            //         onCompleted: ({allPlayersClub}) => {
            //             setAllPlayers(allPlayersClub)
            //         }
            //     })
            // }
        }
    }, [getAllTechnicals, id, type])

    return (
        <ListTechnicals players={allTechnicals as any} />
    );
}
