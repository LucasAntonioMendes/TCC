import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Relatorio.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RelatorioCompleto() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [setoresMapa, setSetoresMapa] = useState({});
  const relatorioRef = useRef();

  const formatarDataGenerica = (dataStr) => {
    if (!dataStr) return "-";
    let data = new Date(dataStr);
    if (!isNaN(data)) return data.toLocaleString("pt-BR");

    const partes = dataStr.split("/");
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      const dataISO = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      data = new Date(dataISO);
      if (!isNaN(data)) return data.toLocaleString("pt-BR");
    }

    return dataStr;
  };

  const gerarPDF = () => {
    const original = relatorioRef.current;
    const clone = original.cloneNode(true);

    clone.style.position = "absolute";
    clone.style.top = "0";
    clone.style.left = "-9999px";
    clone.style.height = "auto";
    clone.style.overflow = "visible";
    clone.style.maxHeight = "none";
    clone.style.background = "white";
    clone.style.color = "black";
    clone.style.fontFamily = '"Times New Roman", serif';

    const tables = clone.querySelectorAll("table");
    tables.forEach((table) => {
      table.style.background = "white";
      table.style.color = "black";
      table.style.border = "1px solid black";
    });

    const cells = clone.querySelectorAll("th, td");
    cells.forEach((cell) => {
      cell.style.border = "1px solid black";
      cell.style.color = "black";
      cell.style.background = "white";
    });

    document.body.appendChild(clone);

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save("relatorio.pdf");
      document.body.removeChild(clone);
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportsRes, setoresRes] = await Promise.all([
          axios.get("http://localhost:3001/reports"),
          axios.get("http://localhost:3001/sectorReport"),
        ]);

        console.log("✅ Reports:", reportsRes.data);
        console.log("✅ Setores:", setoresRes.data);

        setMovimentacoes(reportsRes.data);
        const mapa = {};
        setoresRes.data.forEach((setor) => {
          const nomeProduto = setor.product_name?.toLowerCase().trim();
          if (nomeProduto) {
            mapa[nomeProduto] = setor.setor_nome || "Desconhecido";
          }
        });
        setSetoresMapa(mapa);


        console.log("📌 Mapa final:", mapa);
        setSetoresMapa(mapa);
      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
      }
    }

    fetchData();
  }, []);

  const obterTipoAcao = (mov) => {
    const { action, old_qtdbox = 0, new_qtdbox = 0 } = mov;
    const act = action?.toLowerCase().trim();

    if (act === "create" || new_qtdbox > old_qtdbox) {
      return "Entrada";
    } else if (new_qtdbox < old_qtdbox) {
      return "Saída";
    } else if (act === "update") {
      return "Movimentação";
    } else {
      return "Desconhecida";
    }
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: "center" }}>📋 Relatório Completo de Estoque</h2>

      <div className="resumo" style={{ marginBottom: 20, textAlign: "center" }}>
        <p>📦 Total de registros: {movimentacoes.length}</p>
        <button onClick={gerarPDF}>📄 Gerar PDF</button>
      </div>

      <div className="visual-container" ref={relatorioRef}>
        <div className="tabela-container">
          <h3>Histórico de Movimentações</h3>
          <table className="tabela-visual">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Setor</th>
                <th>Data e Hora</th>
                <th>Ação</th>
                <th>Quantidade De Caixas</th>
              </tr>
            </thead>
            <tbody>
                {movimentacoes.map((mov, index) => {
                  const nomeProduto = mov.product_name?.toLowerCase().trim(); 
                  const setor = setoresMapa[nomeProduto] || "Não informado";  
                  console.log(`🔎 Produto: ${nomeProduto}, Setor encontrado: ${setor}`);

                  return (
                    <tr key={index} className={mov.new_qtdbox < 5 ? "alerta" : ""}>
                      <td>{mov.product_name}</td>
                      <td>{setor}</td>
                      <td>{formatarDataGenerica(mov.performed_at)}</td>
                      <td>{obterTipoAcao(mov)}</td>
                      <td>{mov.new_qtdbox}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
