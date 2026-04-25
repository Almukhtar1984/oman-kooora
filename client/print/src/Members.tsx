import React, {useEffect, useState} from 'react';
import './App.css';
import ListMembers from "./components/PDF/ListMembers";
import {useAllMembers} from "./graphql";
import {useParams} from "react-router-dom";

export default function Members() {
    const {id, type} = useParams()
    const [getAllMembers] = useAllMembers();
    // const [getAllPlayersClub] = useAllPlayersClub();
    const [allMembers, setAllMembers] = useState([]);

    useEffect(() => {
        if (id && id !== "") {
            if (type && type === "team") {
                getAllMembers({
                    variables: {idTeam: id},
                    fetchPolicy: "network-only",
                    onCompleted: ({allMembers}: any) => {
                        setAllMembers(allMembers)
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
    }, [getAllMembers, id, type])

    return (
        <ListMembers players={allMembers as any} />
    );
}
