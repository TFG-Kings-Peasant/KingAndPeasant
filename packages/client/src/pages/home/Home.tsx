import './Home.css'
import HomeButton from './components/HomeButton'

function Home() {


  return (
    <div className="menu-container">
      <div className="cards-grid">
        <HomeButton title="JUGAR" icon="⚔️" description="Buscar partida online" buttonText="BUSCAR SALA" url='/lobbyList'/>
        <HomeButton title="AMIGOS" icon="🫂" description="Encuentra a tus amigos" buttonText="BUSCAR" url='/searchUsers'/>
        <HomeButton title="REGLAS" icon="📜" description="Manual de juego" buttonText="LEER" url='/rules'/>
      </div>
    </div>
  )
}

export default Home