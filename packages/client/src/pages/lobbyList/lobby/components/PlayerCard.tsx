import "./PlayerCard.css";

interface PlayerCardProps {
    name: string;
    avatar: string;
    status: string;
}


export default function PlayerCard({ name, avatar, status }: PlayerCardProps) {
    return (
        <div className="player-card">
            <div className="player-info">
                <div className="player-avatar">
                    <div className="img-container">
                        <img src={avatar} alt={`${name}'s avatar`} />
                    </div>
                </div>
                <div className="player-details">
                    <h1>TÚ</h1>
                    <h3>{name}</h3>
                    <p>Status: {status}</p>
                </div>
            </div>
        </div>
    );
}