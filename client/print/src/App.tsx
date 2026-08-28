import React, {useEffect} from 'react';
import './App.css';
import CardTemplate from "./components/PDF/Card";
import {usePlayer, useMember, useTechnical} from "./graphql";
import {useParams} from "react-router-dom";

// The single-card route (/#/<id>) is reached from every card menu — players,
// board members and technical staff — but the id can belong to any of those
// three tables. Resolve it in order (player → member → technical) so a staff
// card no longer fails with "player not found". All three share the same
// person/team/occupation shape, so the one CardTemplate renders any of them.
function App() {
  const {id} = useParams();

  const [getPlayer, {data: playerData, loading: playerLoading, error: playerError, called: playerCalled}] = usePlayer();
  const [getMember, {data: memberData, loading: memberLoading, error: memberError, called: memberCalled}] = useMember();
  const [getTechnical, {data: techData, loading: techLoading, error: techError, called: techCalled}] = useTechnical();

  // 1) Player table first.
  useEffect(() => {
    if (id && id !== "") {
      getPlayer({variables: {id}, fetchPolicy: "network-only"});
    }
  }, [getPlayer, id]);

  const player = playerData?.player;
  const playerDone = playerCalled && !playerLoading;

  // 2) Not a player → board members.
  useEffect(() => {
    if (id && playerDone && !player) {
      getMember({variables: {id}, fetchPolicy: "network-only"});
    }
  }, [getMember, id, playerDone, player]);

  const member = memberData?.member;
  const memberDone = memberCalled && !memberLoading;

  // 3) Not a member → technical staff.
  useEffect(() => {
    if (id && playerDone && !player && memberDone && !member) {
      getTechnical({variables: {id}, fetchPolicy: "network-only"});
    }
  }, [getTechnical, id, playerDone, player, memberDone, member]);

  const technical = techData?.technicalApparatus;
  const techDone = techCalled && !techLoading;

  const entity = player || member || technical;

  // "Loaded" (→ show the not-found message) only once every lookup we intend to
  // run has finished, so we never flash "not found" while a fallback is still
  // in flight. A found entity short-circuits it.
  const loaded =
    Boolean(entity) ||
    (playerDone && !player && memberDone && !member && techDone && !technical);

  const error = Boolean(!entity && (playerError || memberError || techError));

  return (
    <CardTemplate
      player={entity as any}
      error={error}
      loaded={loaded}
    />
  );
}

export default App;
