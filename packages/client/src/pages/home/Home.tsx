import './Home.css'
import ActionCard from '../../components/ActionCard'

function Home() {
  return (
    <div className="page-shell home-shell">
      <div className="page-content home-content">
        <section className="page-hero home-hero">
          <span className="page-eyebrow">King And Peasant</span>
          <h1 className="page-title">Tu reino, tus aliados, tu próxima batalla</h1>
          <p className="page-subtitle">
            Accede rápido a las salas, gestiona amistades y muévete por la interfaz con una estructura
            más clara y cómoda.
          </p>
        </section>

        <div className="cards-grid">
          <ActionCard title="JUGAR" icon="⚔️" description="Busca una sala y entra directo a la batalla." buttonText="BUSCAR SALA" url='/lobbyList'/>
          <ActionCard title="AMIGOS" icon="🫂" description="Encuentra jugadores, acepta solicitudes y mantén tu red al día." buttonText="VER PANEL" url='/searchUsers'/>
          <ActionCard  title="PERFIL" icon="👑" description="Consulta tus estadísticas y actualiza tus datos desde un solo lugar." buttonText="ABRIR PERFIL" url='/profile'/>
        </div>
      </div>
    </div>
  )
}

export default Home
