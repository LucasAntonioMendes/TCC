import React, { useState, useEffect } from "react";
import "./Modal.css";

export default function Modal({ isOpen, onClose, onToggleTheme, currentTheme, onLogout }) {
  const [activeModal, setActiveModal] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);

  // Carregar notificações do localStorage ao abrir o modal
  useEffect(() => {
    if (activeModal === "notificacao") {
      const savedNotificacoes = localStorage.getItem("notificacoes");
      if (savedNotificacoes) {
        setNotificacoes(JSON.parse(savedNotificacoes));
      } else {
        setNotificacoes([]);
      }
    }
  }, [activeModal]);

  // Função para marcar notificação como lida (ou removê-la)
  function resolverNotificacao(id) {
    const novasNotificacoes = notificacoes.filter((n) => n.id !== id);
    setNotificacoes(novasNotificacoes);
    localStorage.setItem("notificacoes", JSON.stringify(novasNotificacoes));
  }

  const toggleSubModal = (name) => {
    setActiveModal((prev) => (prev === name ? null : name));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
          <h2>Perfil do Usuário</h2>
          <button
            className="notificacao"
            onClick={() => toggleSubModal("notificacao")}
          >
            Notificações
          </button>
          <button className="config" onClick={() => toggleSubModal("config")}>
            Configurações
          </button>

          {/* Novo botão Sair */}
          <button
            className="btn-logout-modal"
            onClick={() => {
              onLogout();
              onClose();
            }}
            style={{ marginTop: "1rem", backgroundColor: "#c0392b", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Modal Notificações */}
      {activeModal === "notificacao" && (
        <div className="floating-modal right resizable">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => toggleSubModal("notificacao")}
            >
              ×
            </button>
            <h3>Notificações</h3>
            {notificacoes.length === 0 && <p>Sem notificações.</p>}
            <ul>
              {notificacoes.map((n) => (
                <li key={n.id}>
                  {n.mensagem}{" "}
                  <button onClick={() => resolverNotificacao(n.id)}>Resolver</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Modal Trocar Usuário */}
      {activeModal === "trocar" && (
        <div className="floating-modal right2 resizable">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => toggleSubModal("trocar")}
            >
              ×
            </button>
            <h3>Trocar Usuário</h3>
            <p>Função de troca de sessão ainda não implementada.</p>
          </div>
        </div>
      )}

      {/* Modal Configurações */}
      {activeModal === "config" && (
        <div className="floating-modal bottom-right resizable">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => toggleSubModal("config")}
            >
              ×
            </button>
            <h3>Configurações</h3>
            <button onClick={onToggleTheme} className="theme-toggle-inside">
              {currentTheme === "light" ? "🌙 Tema Escuro" : "☀️ Tema Claro"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
