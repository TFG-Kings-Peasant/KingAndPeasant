import './Home.css'
import Header from './components/Header'
import HomeButton from './components/HomeButton'

function Home() {

  return (
    <div className="menu-container">
      <Header username="Guille"/>
      <div className="cards-grid">
        <HomeButton title="JUGAR" icon="⚔️" description="Buscar partida online" buttonText="BUSCAR SALA" url='/lobbyList'/>
        <HomeButton title="PERFIL" icon="📊" description="Ver tus estadísticas" buttonText="VER DETALLES" url='/profile'/>
        <HomeButton title="REGLAS" icon="📜" description="Manual de juego" buttonText="LEER" url='/rules'/>
      </div>
    </div>
  )
}

export default Home