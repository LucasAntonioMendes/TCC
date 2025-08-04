import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./NotificacoesSetores.css";

export default function ToastNotificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [saindo, setSaindo] = useState([]);

  const salvarLocalmente = (nova) => {
    const salvas = JSON.parse(localStorage.getItem("notificacoes")) || [];
    const existe = salvas.some((n) => n.codigoSetor === nova.codigoSetor);
    if (!existe) {
      localStorage.setItem("notificacoes", JSON.stringify([...salvas, nova]));
    }
  };

  const adicionarNotificacao = useCallback((nova) => {
    setNotificacoes((prev) => {
      const existe = prev.some((n) => n.codigoSetor === nova.codigoSetor);
      return existe ? prev : [...prev, nova];
    });
    salvarLocalmente(nova);
  }, []);

  const removerComAnimacao = (id) => {
    setSaindo((prev) => [...prev, id]);
    setTimeout(() => {
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      setSaindo((prev) => prev.filter((sid) => sid !== id));
    }, 500);
  };

  useEffect(() => {
    const verificarSetores = async () => {
      try {
        const res = await axios.get("http://localhost:3001/mapa-status");
        const setoresOcupados = res.data.filter(
          (setor) => setor.status === "ocupado"
        );

        setoresOcupados.forEach((setor) => {
          adicionarNotificacao({
            id: `${setor.codigo}-${Date.now()}`,
            codigoSetor: setor.codigo,
            mensagem: `⚠️ O setor ${setor.codigo} está quase lotado!`,
            data: new Date().toLocaleTimeString("pt-BR"),
          });
        });
      } catch (err) {
        console.error("Erro ao buscar setores:", err);
      }
    };

    verificarSetores();
  }, [adicionarNotificacao]);

  return (
    <div className="toast-container">
      {notificacoes.map((n) => (
        <div
          key={n.id}
          className={`toast-notificacao ${
            saindo.includes(n.id) ? "saindo" : "entrando"
          }`}
        >
          <button
            className="fechar-toast"
            onClick={() => removerComAnimacao(n.id)}
          >
            ×
          </button>
          {n.mensagem}
        </div>
      ))}
    </div>
  );
}
