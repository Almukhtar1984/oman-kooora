import React, {useEffect} from 'react';
import './App.css';
import CardTemplate from "./components/PDF/Card";
import {usePlayer} from "./graphql";
import {useParams} from "react-router-dom";

function App() {
  const {id} = useParams()
  const [getPlayer, { data: dataPlayer }] = usePlayer();


  useEffect(() => {
    if (id && id !== "") {
      getPlayer({
        variables: {id},
        fetchPolicy: "network-only"
      })
    }
  }, [getPlayer, id])

  return (
    <CardTemplate player={dataPlayer?.player as any} />
  );
}

export default App;
