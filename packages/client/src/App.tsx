import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import LobbyList from "./pages/lobbyList/LobbyList";

function App() {
  return (
    <Routes>
      {/* Ruta principal (El menú) */}
      <Route path="/" element={<Home />} />
      
      {/* Rutas conectadas a los nuevos archivos */}
      <Route path="/lobbyList" element={<LobbyList />} />
    </Routes>
  )
}

export default App;
