import './HomeButton.css'
interface HomeButtonProps {
    title: string;
    icon: string;
    description: string;
    buttonText: string;
}

export default function HomeButton({ title, icon, description, buttonText }: HomeButtonProps) {
    return (
        <div className="card">
          <div className="card-icon">{icon}</div> {/* Puedes poner una <img> aquí */}
          <h2>{title}</h2>
          <p>{description}</p>
          <button className="action-btn">{buttonText}</button>
        </div> 
    )
    }