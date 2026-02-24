import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LobbyList from "./pages/lobbies/LobbyList";
import LobbyRoom from "./pages/lobbies/LobbyRoom";
import Game from "./pages/game/Game";
import Profile from "./pages/profile/Profile";
import EditProfile from "./pages/profile/EditProfile";
import Dashboard from "./pages/friends/Dashboard";
import { useAuth } from "./hooks/useAuth"
import { useEffect } from "react";
import { GlobalHeader } from "./components/GlobalHeader";


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
    <>  
      <GlobalHeader />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/lobbyList" element={<LobbyList />} />
            <Route path="/lobby/:id" element={<LobbyRoom />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/profile" element={<Profile/>}/>
            <Route path="/editProfile" element={<EditProfile/>}/>
            <Route path="/searchUsers" element={<Dashboard/>}/>
          </Routes>
        </main>
    </>
  )
}

export default App;
