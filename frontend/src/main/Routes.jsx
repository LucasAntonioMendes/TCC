// src/routes.jsx
import { Routes, Route } from 'react-router-dom';

import Inicio from './components/Inicio';
import Cadastro from './components/cadastro';
import Gestao from './components/gestao';
import Mapeamento from './components/mapeamento';
import Movimentacao from './components/movimentacao';
import Relatorio from "../components/Relatorio";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/Inicio" element={<Inicio />} />
      <Route path="/Cadastro" element={<Cadastro />} />
      <Route path="/Gestao" element={<Gestao />} />
      <Route path="/Mapeamento" element={<Mapeamento />} />
      <Route path="/Movimentacao" element={<Movimentacao />} />
      <Route path="/Relatorio" element={<Relatorio />} />
    </Routes>
  );
}
