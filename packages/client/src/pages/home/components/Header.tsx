import './Header.css'

export default function Header({username}: {username:string}) {
    return (
        <header>
            <h1>Kings and Peasant</h1>
            <div className="user-info">
                <p className='user-name'>Hola {username}</p>
                <img src="/tu-foto.png" alt="🖼️" className="avatar-img" />
            </div>
        </header>
    )
}