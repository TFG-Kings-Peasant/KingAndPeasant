import './Home.css'
import ActionCard from '../../components/ActionCard'

function Home() {


  return (
    <div className="menu-container">
      <div className="cards-grid">
        <ActionCard title="JUGAR" icon="⚔️" description="Buscar partida online" buttonText="BUSCAR SALA" url='/lobbyList'/>
        <ActionCard title="AMIGOS" icon="🫂" description="Encuentra a tus amigos" buttonText="BUSCAR" url='/searchUsers'/>
        <ActionCard  title="REGLAS" icon="📜" description="Manual de juego" buttonText="LEER" url='/rules'/>
      </div>
    </div>
  )
}

export default Home