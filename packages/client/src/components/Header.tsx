import './Header.css'

export default function Header({username}: {username:string}) {
    return (
        <header>
            <h1>Kings and Peasant</h1>
            <p>Hola {username}</p>
        </header>
    )
}