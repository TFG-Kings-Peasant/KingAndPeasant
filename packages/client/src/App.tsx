import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import LobbyList from "./pages/lobbyList/LobbyList";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import Lobby from "./pages/lobbyList/lobby/Lobby";
import User from "./pages/user/User";
import EditUser from "./pages/user/EditUser";
import SearchUsers from "./pages/friends/SearchUsers";
import { useAuth } from "./hooks/useAuth"
import { useEffect } from "react";

interface FriendRequestPayload {
  senderId: string;
  senderName: string;
}

function App() {

  const {socket} = useAuth();

  useEffect(() => {
    if (!socket) return;
    
    const handleFriendRequest = (data: FriendRequestPayload) =>{
      console.log("Friend Request received: ", data);
      alert(`¡${data.senderName || 'Alguien'} quiere ser tu amigo!`);
    }

    socket.on('friendRequest', handleFriendRequest);

    return () => {
      socket.off('friendRequest', handleFriendRequest);
    };
    
  }, [socket]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/lobbyList" element={<LobbyList />} />
      <Route path="/lobby/:id" element={<Lobby />} />
      <Route path="/profile" element={<User/>}/>
      <Route path="/editProfile" element={<EditUser/>}/>
      <Route path="/searchUsers" element={<SearchUsers/>}/>
    </Routes>
  )
}

export default App;
