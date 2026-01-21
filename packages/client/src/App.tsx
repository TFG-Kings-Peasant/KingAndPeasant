import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";

function App() {
  return (
    <Routes>
      {/* Ruta principal (El menú) */}
      <Route path="/" element={<Home />} />
      
      {/* Rutas conectadas a los nuevos archivos */}

    </Routes>
  )
}

export default App;
