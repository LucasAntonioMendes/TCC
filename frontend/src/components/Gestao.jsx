import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Gestao.css";

export default function GerenciarProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [editandoProduto, setEditandoProduto] = useState(null);

  useEffect(() => {
    buscarProdutos();
  }, []);

  const buscarProdutos = async () => {
    try {
      const res = await axios.get("http://localhost:3001/products");
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await axios.delete(`http://localhost:3001/products/${id}`);
        setProdutos(produtos.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Erro ao deletar produto:", err);
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["qtdbox", "qtduni"];
    const parsedValue = numericFields.includes(name)
      ? value === "" ? "" : parseInt(value)
      : value;

    setEditandoProduto((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/products/${editandoProduto.id}`, editandoProduto);
      await buscarProdutos();
      setEditandoProduto(null);
      alert("Produto atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao editar produto:", err);
      alert("Erro ao atualizar o produto.");
    }
  };

  return (
    <div className="gestao-centralizada">
      <div className="tabela-container">
        <h2>🛠️ Gerenciar Produtos</h2>

        <div className="tabela-scroll">
          <table className="tabela-visual">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Marca</th>
                <th>Validade</th>
                <th>Caixas</th>
                <th>Unidades</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>{p.productname}</td>
                  <td>{p.categoria}</td>
                  <td>{p.marca}</td>
                  <td>{p.validade ? p.validade.substring(0, 10) : "-"}</td>
                  <td>{p.qtdbox}</td>
                  <td>{p.qtduni}</td>
                  <td>
                    <div className="acoes-botoes">
                      <button onClick={() => setEditandoProduto(p)}>Editar</button>
                      <button onClick={() => handleDelete(p.id)}>Apagar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editandoProduto && (
        <div className="modal">
          <form onSubmit={handleEditSubmit} className="form-edicao-produto">
            <h3>Editar Produto</h3>

            <input
              type="text"
              name="productname"
              value={editandoProduto.productname || ""}
              onChange={handleEditChange}
              placeholder="Nome do produto"
              required
            />

            <input
              type="date"
              name="validade"
              value={editandoProduto.validade ? editandoProduto.validade.slice(0, 10) : ""}
              onChange={handleEditChange}
            />

            <input
              type="text"
              name="description"
              value={editandoProduto.description || ""}
              onChange={handleEditChange}
              placeholder="Descrição"
            />

            <input
              type="text"
              name="marca"
              value={editandoProduto.marca || ""}
              onChange={handleEditChange}
              placeholder="Marca"
            />

            <input
              type="number"
              name="qtdbox"
              value={editandoProduto.qtdbox !== undefined ? editandoProduto.qtdbox : ""}
              onChange={handleEditChange}
              placeholder="Quantidade de Caixas"
              required
            />

            <input
              type="number"
              name="qtduni"
              value={editandoProduto.qtduni !== undefined ? editandoProduto.qtduni : ""}
              onChange={handleEditChange}
              placeholder="Quantidade Unitária"
              required
            />

            <input
              type="text"
              name="categoria"
              value={editandoProduto.categoria || ""}
              onChange={handleEditChange}
              placeholder="Categoria"
            />

            <input
              type="text"
              name="sector_id"
              value={editandoProduto.sector_id || ""}
              onChange={handleEditChange}
              placeholder="ID do Setor"
              required
            />

            <button type="submit">Salvar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}
