import React, {useEffect} from 'react';
import './App.css';
import AssemblyCardTemplate from "./components/PDF/AssemblyCard";
import {useAssembly} from "./graphql";
import {useParams} from "react-router-dom";

function CardAssembly() {
    const {id} = useParams()
    const [getAssembly, { data: dataAssembly }] = useAssembly();

    useEffect(() => {
        if (id && id !== "") {
            getAssembly({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id])

    return (
        <AssemblyCardTemplate assembly={dataAssembly?.assembly as any} />
    );
}

export default CardAssembly;
