import React, { useState } from 'react';
import "./Cadastro.css";
import axios from 'axios';

const exemplosPorCategoria = {
  "Eletrônicos": ["PC", "Notebook", "Mouse", "Monitor"],
  "Moda e Acessórios": ["Camisa", "Bolsa", "Tênis", "Óculos"],
  "Casa e Decoração": ["Sofá", "Mesa", "Tapete", "Abajur"],
  "Beleza e Cosméticos": ["Perfume", "Creme", "Maquiagem", "Shampoo"],
  "Alimentos e Bebidas": ["Arroz", "Feijão", "Refrigerante", "Pão"],
};

const marcasPorCategoria = {
  "Eletrônicos": ["Samsung", "Apple", "Sony", "LG"],
  "Moda e Acessórios": ["Nike", "Adidas", "Levi's", "Zara"],
  "Casa e Decoração": ["IKEA", "Tok&Stok", "Etna", "Leroy Merlin"],
  "Beleza e Cosméticos": ["Natura", "Avon", "O Boticário", "L'Oréal"],
  "Alimentos e Bebidas": ["Nestlé", "Coca-Cola", "Pepsi", "Ambev"],
};

const ControleEstoque = () => {
  const [categoria, setCategoria] = useState('');
  const [produto, setProduto] = useState('');
  const [marca, setMarca] = useState('');
  const [validade, setValidade] = useState('');
  const [qtdBox, setQtdBox] = useState(0);
  const [qtdUni, setQtdUni] = useState(0);
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  const sugestoes = exemplosPorCategoria[categoria] || [];
  const marcas = marcasPorCategoria[categoria] || [];

  const checarEstoque = async (setor) => {
    try {
      const res = await axios.get(`http://localhost:3001/estoque/${setor}/resumo`);
      const data = res.data;
      console.log(`📦 Dados crus do setor ${setor}:`, data);

      const totalProdutos = Number(
        data.totalProdutosDiferentes ??
        data.total_produtos_diferentes ??
        data.produtosDiferentes ??
        data.resumo?.produtosDiferentes ??
        data.resumo?.totalProdutosDiferentes ??
        0
      );

      const totalUnidades = Number(
        data.totalUnidades ??
        data.total_unidades ??
        data.unidades ??
        data.resumo?.totalUnidades ??
        data.resumo?.unidades ??
        0
      );

      console.log(`🔍 Setor ${setor} - Produtos: ${totalProdutos} | Unidades: ${totalUnidades}`);
      return { totalProdutosDiferentes: totalProdutos, totalUnidades };
    } catch (err) {
      console.error("❌ Erro ao checar estoque:", err);
      return null;
    }
  };

  const buscarSetoresPorCategoria = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/setores-por-categoria/${encodeURIComponent(categoria)}`);
      return res.data;
    } catch (err) {
      console.error("❌ Erro ao buscar setores por categoria:", err);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qtdBoxNum = Number(qtdBox);
    const qtdUniNum = Number(qtdUni);

    if (
      !categoria || !produto.trim() || !marca.trim() || !validade ||
      isNaN(qtdBoxNum) || qtdBoxNum <= 0 ||
      isNaN(qtdUniNum) || qtdUniNum <= 0 ||
      !descricao.trim()
    ) {
      setMensagem("⚠️ Preencha todos os campos corretamente.");
      return;
    }

    const validadeFormatada = new Date(validade).toISOString().split("T")[0];
    const unidadesNovoProduto = qtdBoxNum * qtdUniNum;

    const setores = await buscarSetoresPorCategoria();
    if (!setores.length) {
      setMensagem("❌ Nenhum setor encontrado para esta categoria.");
      return;
    }

  let setorSelecionado = null;
  let nomeSetorSelecionado = null; // ← novo

  for (const setor of setores) {
    const resumo = await checarEstoque(setor.id);
    if (!resumo) continue;

    const { totalProdutosDiferentes, totalUnidades } = resumo;
    console.log(`📊 Setor ${setor.setor} | Produtos: ${totalProdutosDiferentes} | Unidades: ${totalUnidades}`);

    if (
      totalProdutosDiferentes < 100 &&
      (totalUnidades + unidadesNovoProduto) <= 10000
    ) {
      setorSelecionado = setor.id;
      nomeSetorSelecionado = setor.setor;
      console.log(`✅ Setor selecionado: ${setor.setor} (${setor.id})`);
      break;
    }
  }


    if (!setorSelecionado) {
      setMensagem("❌ Todos os setores da categoria estão lotados.");
      return;
    }

    const dados = {
      categoria,
      productName: produto,
      marca,
      validade: validadeFormatada,
      qtdBox: qtdBoxNum,
      qtdUni: qtdUniNum,
      description: descricao,
      sector_id: setorSelecionado,
    };

    try {
      const response = await axios.post("http://localhost:3001/auth/register/product", dados);
      if (response.status === 200 || response.status === 201) {
setMensagem(`✅ Produto "${produto}" adicionado com sucesso no setor ${nomeSetorSelecionado}!`);  
        setProduto('');
        setMarca('');
        setCategoria('');
        setValidade('');
        setQtdBox(0);
        setQtdUni(0);
        setDescricao('');
      } else {
        setMensagem("⚠️ Erro ao adicionar o produto.");
      }
    } catch (err) {
      console.error("❌ Erro ao enviar produto:", err);
      setMensagem("❌ Erro ao adicionar o produto.");
    }
  };

  return (
    <div id="controle-total">
      <div id="controle-estoque">
        <h3>Controle de Estoque</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="categoria">Categoria:</label>
          <select id="categoria" value={categoria} onChange={e => setCategoria(e.target.value)} required>
            <option value="">Selecione uma categoria</option>
            {Object.keys(exemplosPorCategoria).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label htmlFor="produto">Nome do Produto:</label>
          <input type="text" id="produto" list="sugestoes" value={produto} onChange={e => setProduto(e.target.value)} required />
          <datalist id="sugestoes">
            {sugestoes.map((item, i) => <option key={i} value={item} />)}
          </datalist>

          <label htmlFor="marca">Marca:</label>
          <input list="marcas" id="marca" value={marca} onChange={e => setMarca(e.target.value)} required />
          <datalist id="marcas">
            {marcas.map((item, i) => <option key={i} value={item} />)}
          </datalist>

          <label htmlFor="validade">Data de Validade:</label>
          <input type="date" id="validade" value={validade} onChange={e => setValidade(e.target.value)} required />

          <label htmlFor="qtdBox">Quantidade de caixas:</label>
          <input type="number" id="qtdBox" min="1" value={qtdBox} onChange={e => setQtdBox(Number(e.target.value))} required />

          <label htmlFor="qtdUni">Quantidade unitária:</label>
          <input type="number" id="qtdUni" min="1" value={qtdUni} onChange={e => setQtdUni(Number(e.target.value))} required />

          <label htmlFor="descricao">Descrição:</label>
          <input type="text" id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} required />

          <button type="submit">Adicionar</button>
        </form>

        {mensagem && <p>{mensagem}</p>}
      </div>
    </div>
  );
};

export default ControleEstoque;
