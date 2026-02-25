import './ActionCard.css'
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
    title: string;
    icon: string;
    description: string;
    buttonText: string;
    url: string;
}

export default function ActionCard({ title, icon, description, buttonText, url }: ActionCardProps) {
    const navigate = useNavigate();
    return (
        <div className="card">

          <div className='card-top'>

            <div className="card-icon">{icon}</div> {/* Puedes poner una <img> aquí */}
            
          </div>

          <div className='card-bottom'>

            <h2>{title}</h2>
            <p>{description}</p>

            <button className="action-btn" onClick={() => navigate(url)}>{buttonText}</button>

          </div>

        </div> 
    )
    }