import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import LobbyList from "./pages/lobbyList/LobbyList";
import Lobby from "./pages/lobbyList/lobby/Lobby";

function App() {
  return (
    <Routes>
      {/* Ruta principal (El menú) */}
      <Route path="/" element={<Home />} />
      
      {/* Rutas conectadas a los nuevos archivos */}
      <Route path="/lobbyList" element={<LobbyList />} />
      <Route path="/lobby/:id" element={<Lobby />} />
    </Routes>
  )
}

export default App;
