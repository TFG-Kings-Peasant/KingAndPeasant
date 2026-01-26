import Header from "../home/components/Header";



function LobbyList() {
    return <div>
        <Header username="Guille"/>
<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Anfitrion</th>
            <th>Jugadores</th>
            <th>Estado</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>12345</td>
            <td>HostUser_01</td>
            <td>1/2</td>
            <td>Unirse</td>
        </tr>
        <tr>
            <td>67890</td>
            <td>ProGamer</td>
            <td>1/2</td>
            <td>Privada</td>
        </tr>
    </tbody>
</table>
    </div>;
}

export default LobbyList