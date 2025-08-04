import express from 'express';
import cors from 'cors';
import { DatabasePostgres } from './databasePostgres.js';
import './createTable.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createTablesAndSeed } from './createTable.js';

await createTablesAndSeed();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const database = new DatabasePostgres();

// Cadastro usuário
app.post('/auth/register/user', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: 'Preencha todos os campos!' });
    }

    const existingUser = await database.findByEmail(email);
    if (existingUser) {
        return res.status(400).json({ msg: 'Email já está cadastrado!' });
    }

    await database.createUser({ name, email, password, role });
    res.status(201).json({ msg: 'Usuário criado!' });
});

// Cadastro produto
app.post('/auth/register/product', async (req, res) => {
    const { productName, validade, description, marca, qtdUni, qtdBox, categoria, sector_id } = req.body;

    if (!productName || !validade || !description || !marca || !qtdUni || !qtdBox || !categoria || !sector_id) {
        return res.status(400).json({ msg: 'Preencha todos os campos!' });
    }

    try {
        await database.createProduct({ productName, validade, description, marca, qtdUni, qtdBox, categoria, sector_id });
        res.status(201).json({ msg: 'Produto adicionado com sucesso!' });
    } catch (err) {
        console.error("❌ Erro ao adicionar produto:", err);
        res.status(500).json({ msg: 'Erro ao adicionar produto no banco.' });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: 'Preencha email e senha!' });
    }

    const user = await database.findByEmail(email);
    if (!user) {
        return res.status(400).json({ msg: 'Usuário não encontrado' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ msg: 'Senha inválida!' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET || 'minhaChaveSuperSecreta',
        { expiresIn: '1d' }
    );

    res.json({
        msg: 'Login realizado',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role 
        }
    });
});
// Criar usuário
app.post('/users', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Preencha todos os campos!' });
    }

    try {
        await database.createUser({ name, email, password });
        res.status(201).json({ msg: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ msg: 'Erro ao criar usuário.' });
    }
});

// Rota protegida exemplo
app.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'Token não fornecido!' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'minhaChaveSuperSecreta');
        res.json({ msg: 'Acesso autorizado!', decoded });
    } catch (err) {
        res.status(401).json({ msg: 'Token inválido!' });
    }
});

// Listar usuários
app.get('/users', async (req, res) => {
    const users = await database.list();
    res.json(users);
});

// Atualizar usuário
app.put('/users/:id', async (req, res) => {
    const id = req.params.id;
    const user = req.body;
    await database.update(id, user);
    res.status(204).send();
});

// Atualizar produto
app.put('/products/:id', async (req, res) => {
    const id = req.params.id;
    const product = req.body;

    if (!product.productname || !product.categoria) {
        return res.status(400).json({ msg: "Campos obrigatórios faltando: 'productname' ou 'categoria'." });
    }

    try {
        await database.updateProduct(id, product);
        res.status(200).json({
            msg: 'Produto atualizado com sucesso!',
            productAtualizado: { id, ...product }
        });
    } catch (err) {
        console.error("Erro ao atualizar produto:", err);
        res.status(500).json({ msg: 'Erro ao atualizar produto.' });
    }
});

// Deletar produto
app.delete('/products/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await database.deleteProduct(id);
        res.status(204).send();
    } catch (err) {
        console.error("Erro ao deletar produto:", err);
        res.status(500).json({ msg: 'Erro ao deletar produto.' });
    }
});

// Deletar usuário
app.delete('/users/:id', async (req, res) => {
    const id = req.params.id;
    await database.delete(id);
    res.status(204).send();
});

// Buscar relatórios
app.get('/reports', async (req, res) => {
    const reports = await database.getReports();
    res.json(reports);
});

app.get('/estoque/:setor/resumo', async (req, res) => {
    const { setor } = req.params;
    try {
        const resumo = await database.getResumoEstoquePorSetor(setor);
        if (!resumo) {
            return res.status(500).json({ msg: 'Erro ao buscar resumo do estoque' });
        }
        res.json({
            totalProdutosDiferentes: parseInt(resumo.totalprodutosdiferentes),
            totalUnidades: parseInt(resumo.totalunidades),
        });
    } catch (error) {
        console.error("Erro na rota /estoque/:setor/resumo:", error);
        res.status(500).json({ msg: 'Erro no servidor' });
    }
});

app.get('/setores-por-categoria/:categoria', async (req, res) => {
    const categoria = req.params.categoria;
    console.log("Categoria recebida:", categoria);

    try {
        const setores = await database.getSetoresPorCategoria(categoria);
        res.json(setores);
    } catch (error) {
        console.error("Erro ao buscar setores por categoria:", error);
        res.status(500).json({ error: "Erro ao buscar setores por categoria" });
    }
});

app.get('/sector', async (req, res) => {
    try {
        const result = await database.getProdutosPorSetor();
        res.json(result);
    } catch (error) {
        console.error("Erro ao buscar setores:", error);
        res.status(500).json({ error: "Erro ao buscar setores" });
    }
});

app.get('/sectorReport', async (req, res) => {
    try {
        const setores = await database.getSetoresReports();
        res.json(setores);
    } catch (error) {
        console.error("Erro ao buscar setores report:", error);
        res.status(500).json({ error: "Erro ao buscar setores report" });
    }
});



// Buscar produtos (com filtro opcional por categoria)
app.get("/products", async (req, res) => {
    const categoria = req.query.categoria;
    try {
        let result;
        if (categoria) {
            result = await database.getProdutosPorCategoria(categoria);
        } else {
            result = await database.getproducts();
        }
        res.json(result);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

// Buscar setores
app.get('/sectors', async (req, res) => {
    try {
        const categorias = await database.getCategorias();
        res.json(categorias);
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});




// Rota para movimentar produto entre setores ou para caminhão (fora do sistema)
app.post('/move-product', async (req, res) => {
    const { produto_id, destino, quantidade } = req.body;
    if (!produto_id || !destino || !quantidade || quantidade <= 0) {
        return res.status(400).json({ msg: 'Dados inválidos para movimentação' });
    }

    try {
        const produtos = await database.getproducts();
        const produto = produtos.find(p => p.id === produto_id);
        if (!produto) return res.status(404).json({ msg: 'Produto não encontrado' });

        if (quantidade > produto.qtdbox) {
            return res.status(400).json({ msg: 'Quantidade maior que disponível' });
        }

        const novoQtdBoxOrigem = produto.qtdbox - quantidade;

        if (destino === 'caminhao') {
            const novoQtdBox = produto.qtdbox - quantidade;

            if (novoQtdBox < 0) {
                return res.status(400).json({ msg: 'Estoque insuficiente' });
            }

            if (novoQtdBox === 0) {
                // remove do banco se não sobrou nada
                await database.deleteProduct(produto_id);
            } else {
                // atualiza a nova quantidade se ainda sobrar
                await database.updateProduct(produto_id, { qtdbox: novoQtdBox });
            }

            await database.logReport('saida_caminhao', produto_id, produto.productname, produto.qtdbox, novoQtdBox);

            return res.json({ msg: 'Movimento para caminhão realizado com sucesso' });
        }

        // Verifica se já existe esse produto no destino (mesmo nome e setor)
        const produtosDestino = await database.getProductByNameAndSetor(produto.productname, destino);

        if (produtosDestino.length > 0) {
            // Atualiza o produto existente no setor destino
            const prodDestino = produtosDestino[0];
            const novaQtd = prodDestino.qtdbox + quantidade;
            await database.updateProduct(prodDestino.id, { qtdbox: novaQtd });
        } else {
            // Cria um novo produto no setor destino com nova quantidade
            await database.createProduct({
                productName: produto.productname,
                validade: produto.validade,
                description: produto.description,
                marca: produto.marca,
                qtdUni: produto.qtduni,
                qtdBox: quantidade,
                categoria: produto.categoria,
                sector_id: destino
            });
        }

        // Atualiza a quantidade no setor de origem
        await database.updateProduct(produto_id, { qtdbox: novoQtdBoxOrigem });
        await database.logReport('movimentacao', produto_id, produto.productname, produto.qtdbox, novoQtdBoxOrigem);

        return res.json({ msg: 'Produto movido entre setores com sucesso' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Erro no servidor' });
    }
});

// mapeamento 
app.get('/mapa-status', async (req, res) => {
    try {
        const resultado = await database.getMapaStatus();
        res.json(resultado);
    } catch (err) {
        console.error("Erro no /mapa-status:", err);
        res.status(500).json({ erro: "Erro ao obter status do mapa." });
    }
});

  
// Servidor rodando
app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
