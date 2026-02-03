import './Home.css'
import Header from './components/Header'
import HomeButton from './components/HomeButton'
import { useUser } from '../../hooks/useUser'

function Home() {

  const { user, isLogin, logout } = useUser();

  return (
    <div className="menu-container">
      <Header username="Guille"/>
      <div className="cards-grid">
        <HomeButton title="JUGAR" icon="⚔️" description="Buscar partida online" buttonText="BUSCAR SALA" url='/lobbyList'/>
        <HomeButton title="PERFIL" icon="📊" description="Ver tus estadísticas" buttonText="VER DETALLES" url='/profile'/>
        <HomeButton title="REGLAS" icon="📜" description="Manual de juego" buttonText="LEER" url='/rules'/>
        <button 
          onClick={logout} 
          style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}
          >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

export default Home