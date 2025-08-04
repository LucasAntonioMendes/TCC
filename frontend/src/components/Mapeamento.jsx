import React, { useEffect, useRef, useState } from "react";
import "./Mapeamento.css";

const setoresValidos = {
  A: "Eletrônicos",
  B: "Moda e Acessórios",
  C: "Casa e Decoração",
  D: "Beleza e Cosméticos",
  E: "Alimentos e Bebidas"
};

export default function Mapeamento() {
  const [detalhes, setDetalhes] = useState("Clique em uma posição para ver detalhes.");
  const posRef = useRef([]);
  const [posicoes, setPosicoes] = useState([]);

  useEffect(() => {
    async function buscarStatusDoBackend() {
      try {
        const resposta = await fetch("http://localhost:3001/mapa-status");
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
        const dados = await resposta.json();

        const mapa = dados
          .filter(pos => setoresValidos[pos.setor]) 
          .map(pos => ({
            ...pos,
            setor: setoresValidos[pos.setor], 
            status: pos.status || "livre"
          }));

        setPosicoes(mapa);
      } catch (erro) {
        console.error("Erro ao buscar dados do backend:", erro);
        setDetalhes("⚠ Erro ao conectar com o servidor. Veja o console.");
      }
    }

    buscarStatusDoBackend();
  }, []);

  const exibirDetalhes = (pos) => {
    const statusStr = (pos.status || "").toString().toUpperCase();
    const texto = `📌 Posição: ${pos.codigo}\n📦 Status: ${statusStr}\n🏷️ Setor: ${pos.setor || "—"}`;
    setDetalhes(texto);
  };

  const scrollParaSetor = (setor) => {
    let encontrou = false;
    posRef.current.forEach((el) => {
      if (!el) return;
      const tipo = el.dataset.tipo;
      if (tipo && tipo.toLowerCase() === setor.toLowerCase()) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.outline = "4px solid yellow";
        encontrou = true;
        setTimeout(() => {
          el.style.outline = "none";
        }, 2000);
      }
    });

    if (!encontrou) {
      setDetalhes(`Nenhuma posição encontrada para: ${setor}`);
    }
  };

  const verificarAlertas = () => {
    let ocup = 0;
    let liv = 0;
    let setoresEmAlerta = [];

    posRef.current.forEach((div) => {
      if (!div) return;
      const status = div.dataset.status;
      const tipo = div.dataset.tipo;

      div.classList.remove("alerta");

      if (status === "ocupado") {
        ocup++;
        div.classList.add("alerta");
      } else {
        liv++;
      }

      if (tipo && Math.random() < 0.05) {
        setoresEmAlerta.push(`⚠ Estoque baixo em: ${tipo}`);
      }
    });

    let texto = `📦 Total Ocupado: ${ocup}\n✅ Total Livre: ${liv}`;
    if (setoresEmAlerta.length > 0) {
      texto += `\n\n🚨 ALERTAS:\n` + setoresEmAlerta.join("\n");
    }
    setDetalhes(texto);
  };

  useEffect(() => {
    if (posicoes.length > 0) {
      verificarAlertas();
      const interval = setInterval(verificarAlertas, 5000);
      return () => clearInterval(interval);
    }
  }, [posicoes]);

  return (
    <div className="mapeamento-container">
      <aside className="sidebar">
        <h2>Informações</h2>
        <pre id="detalhes">{detalhes}</pre>

        <h2>Setores</h2>
        <ul id="setores">
          {Object.values(setoresValidos).map((setor) => (
            <li
              key={setor}
              onClick={() => scrollParaSetor(setor)}
              style={{ cursor: "pointer" }}
            >
              {setor}
            </li>
          ))}
        </ul>
      </aside>

      <main className="content">
        <h1>Mapa Interativo do Armazém</h1>
        <div id="mapa">
          {posicoes.map((pos, index) => (
            <div
              key={pos.codigo}
              className={`posicao ${pos.status}`}
              data-pos={pos.codigo}
              data-status={pos.status}
              data-tipo={pos.setor}
              ref={(el) => (posRef.current[index] = el)}
              onClick={() => exibirDetalhes(pos)}
              style={{ cursor: "pointer" }}
            >
              {pos.codigo}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
