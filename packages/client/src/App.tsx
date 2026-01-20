import './App.css'
import Header from './components/Header'
import HomeButton from './components/HomeButton'

function App() {

  return (
    <div className="menu-container">
      <Header username="Guille"/>
      <div className="cards-grid">
        <HomeButton title="JUGAR" icon="⚔️" description="Buscar partida online" buttonText="BUSCAR SALA" />
        <HomeButton title="PERFIL" icon="⚔️" description="Ver tus estadísticas" buttonText="VER DETALLES" />
        <HomeButton title="REGLAS" icon="📜" description="Manual de juego" buttonText="LEER" />
      </div>
    </div>
  )
}

export default App
