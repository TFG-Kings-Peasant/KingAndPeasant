import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import LobbyList from "./pages/lobbyList/LobbyList";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import Lobby from "./pages/lobbyList/lobby/Lobby";
import Game from "./pages/game/Game";
import User from "./pages/user/User";
import EditUser from "./pages/user/EditUser";

function App() {
  return (
    <Routes>
      {/* Ruta principal (El menú) */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/lobbyList" element={<LobbyList />} />
      <Route path="/lobby/:id" element={<Lobby />} />
      <Route path="/game/:id" element={<Game />} />
      <Route path="user" element={<User/>}/>
      <Route path="/profile" element={<User/>}/>
      <Route path="/editProfile" element={<EditUser/>}/>
    </Routes>
  )
}

export default App;
