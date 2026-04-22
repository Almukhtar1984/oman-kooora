import React, {useEffect, useState} from 'react';
import './App.css';
import ListAssembly from "./components/PDF/ListAssembly";
import {useAllAssemblyTeam, useAllAssemblyClub} from "./graphql";
import {useParams} from "react-router-dom";

export default function Assembly() {
    const {id, type} = useParams()
    const [getAllAssemblyTeam] = useAllAssemblyTeam();
    const [getAllAssemblyClub] = useAllAssemblyClub();

    const [allAssembly, setAllAssembly] = useState([]);

    console.log({id, type})

    useEffect(() => {
        if (id && id !== "") {
            if (type && type === "team") {
                getAllAssemblyTeam({
                    variables: {idTeam: id},
                    fetchPolicy: "network-only",
                    onCompleted: ({allAssemblyTeam}: any) => {
                        setAllAssembly(allAssemblyTeam)
                    }
                })
            } else if (type && type === "club"){
                getAllAssemblyClub({
                    variables: {idClub: id},
                    fetchPolicy: "network-only",
                    onCompleted: ({allAssemblyClub}) => {
                        setAllAssembly(allAssemblyClub)
                    }
                })
            }
        }
    }, [id])

    return (
        <ListAssembly assemblies={allAssembly as any} />
    );
}