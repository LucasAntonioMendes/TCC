import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./Movimentacao.css"

export default function MovimentacaoProdutos() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [setores, setSetores] = useState([]);
  const [setorDestino, setSetorDestino] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/sectors')
      .then(res => {
        const cats = res.data.map(c => c.categoria);
        setCategorias(cats);
      })
      .catch(() => setMensagem('Erro ao carregar categorias'));
  }, []);
  

  useEffect(() => {
    if (!categoriaSelecionada) {
      setProdutos([]);
      setSetores([]);
      return;
    }
    axios.get('http://localhost:3001/products')
      .then(res => {
        const filtrados = res.data.filter(p => p.categoria === categoriaSelecionada);
        setProdutos(filtrados);
      })
      .catch(() => setMensagem('Erro ao carregar produtos'));

    axios.get(`http://localhost:3001/setores-por-categoria/${encodeURIComponent(categoriaSelecionada)}`)
      .then(res => setSetores(res.data))
      .catch(() => setMensagem('Erro ao carregar setores da categoria'));
  }, [categoriaSelecionada]);

  const moverProduto = async () => {
    if (!produtoSelecionado || !setorDestino || quantidade <= 0) {
      setMensagem('Selecione produto, quantidade e setor destino');
      return;
    }

    if (quantidade > produtoSelecionado.qtdbox) {
      setMensagem('Quantidade excede o disponível');
      return;
    }

    try {
      await axios.post('http://localhost:3001/move-product', {
        produto_id: produtoSelecionado.id,
        destino: setorDestino,
        quantidade
      });

      let nomeDestino = 'setor desconhecido';
      if (setorDestino === 'caminhao') nomeDestino = 'Caminhão (fora do sistema)';
      else nomeDestino = setores.find(s => s.id === setorDestino)?.setor || nomeDestino;

      setMensagem(`Movido ${quantidade} caixa(s) de ${produtoSelecionado.productname} para ${nomeDestino}`);

      setProdutoSelecionado(null);
      setSetorDestino('');
      setQuantidade(1);

      // Atualizar produtos e setores
      axios.get('http://localhost:3001/products')
        .then(res => {
          const filtrados = res.data.filter(p => p.categoria === categoriaSelecionada);
          setProdutos(filtrados);
        });

      axios.get(`http://localhost:3001/setores-por-categoria/${encodeURIComponent(categoriaSelecionada)}`)
        .then(res => setSetores(res.data));

    } catch {
      setMensagem('Erro ao mover produto');
    }
  };

  return (
    <div class="movimentacao-container">
      <h2>Movimentação de Produtos</h2>

      <label>Categoria:</label>
      <select value={categoriaSelecionada} onChange={e => setCategoriaSelecionada(e.target.value)}>
        <option value="">Selecione</option>
        {categorias.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {produtos.length > 0 && (
        <>
          <label>Produto:</label>
          <select value={produtoSelecionado?.id || ''} onChange={e => {
            const p = produtos.find(p => p.id === e.target.value);
            setProdutoSelecionado(p || null);
            setQuantidade(1);
          }}>
            <option value="">Selecione</option>
            {produtos.map(p => (
  <option key={p.id} value={p.id}>
    {p.productname} - {p.qtdbox} caixas ({p.setor || 'sem setor'})
  </option>
))}

          </select>

          {produtoSelecionado && (
            <>
              <label>Quantidade a mover:</label>
              <input
                type="number"
                min={1}
                max={produtoSelecionado.qtdbox}
                value={quantidade}
                onChange={e => setQuantidade(Number(e.target.value))}
              />
            </>
          )}
        </>
      )}

      {setores.length > 0 && (
        <>
          <label>Destino:</label>
          <select value={setorDestino} onChange={e => setSetorDestino(e.target.value)}>
            <option value="">Selecione setor destino</option>
            {setores.map(s => (
              <option key={s.id} value={s.id}>{s.setor}</option>
            ))}
            <option value="caminhao">Caminhão (fora do sistema)</option>
          </select>
        </>
      )}

      <button onClick={moverProduto}>Mover Produto</button>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}
