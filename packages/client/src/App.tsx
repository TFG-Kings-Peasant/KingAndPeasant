import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import LobbyList from "./pages/lobbyList/LobbyList";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import User from "./pages/user/User";

function App() {
  return (
    <Routes>
      {/* Ruta principal (El menú) */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      {/* Rutas conectadas a los nuevos archivos */}
      <Route path="/lobbyList" element={<LobbyList />} />
      <Route path="user" element={<User/>}/>
    </Routes>
  )
}

export default App;
