import './HomeButton.css'
import { useNavigate } from 'react-router-dom';

interface HomeButtonProps {
    title: string;
    icon: string;
    description: string;
    buttonText: string;
    url: string;
}

export default function HomeButton({ title, icon, description, buttonText, url }: HomeButtonProps) {
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