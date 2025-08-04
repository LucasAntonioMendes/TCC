import React from "react";
import "./Inicio.css"; // Crie esse CSS se quiser estilizar separado

export default function Inicio() {
  return (
    <div className="inicio-container">
      <h1>Bem-vindo ao Flux<span className="destaque">Ware</span></h1>
      <p className="subtitulo">
        Sistema de Monitoramento de Fluxo de Materiais em Armazéns
      </p>

      <div className="cards">
        <div className="card">
          <h3>Cadastro de Produtos</h3>
          <p>Registre novos produtos com categorias e quantidades.</p>
        </div>

        <div className="card">
          <h3>Gestão de Estoque</h3>
          <p>Gerencie entradas, saídas e histórico de movimentações.</p>
        </div>

        <div className="card">
          <h3>Mapeamento</h3>
          <p>Visualize a disposição dos produtos no armazém.</p>
        </div>

        <div className="card">
          <h3>Movimentação</h3>
          <p>Realize movimentações rápidas entre setores ou áreas.</p>
        </div>
      </div>
    </div>
  );
}
