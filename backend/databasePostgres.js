import { randomUUID } from 'node:crypto';
import { sql } from './sql.js';
import bcrypt from 'bcrypt';

export class DatabasePostgres {
    async list() {
        try {
            return await sql`SELECT * FROM users`;
        } catch (err) {
            console.error("Erro ao listar usuários:", err);
            return [];
        }
    }

    async createUser(user) {
        const userId = randomUUID();
        const { name, email, password, role = '' } = user;
        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
        INSERT INTO users(id, name, email, password, role)
        VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${role})
    `;
    }

    async createProduct(productData) {
        const {
            productName,
            validade,
            description,
            marca,
            qtdUni,
            qtdBox,
            categoria
        } = productData;

        const letraMap = {
            'Moda e Acessórios': 'A',
            'Casa e Decoração': 'B',
            'Beleza e Cosméticos': 'C',
            'Alimentos e Bebidas': 'D',
            'Eletrônicos': 'E'
        };

        const letras = Object.values(letraMap);
        const letraInicial = letraMap[categoria];
        if (!letraInicial) {
            console.error(`Categoria inválida: ${categoria}`);
            return false;
        }

        const MAX_PRODUTOS_DISTINTOS = 300;
        const MAX_UNIDADES = 5000;
        const productId = randomUUID();

        for (let i = letras.indexOf(letraInicial); i < letras.length; i++) {
            const letra = letras[i];
            const [setor] = await sql`
                SELECT id FROM sectors
                WHERE codigo LIKE ${letra + '%'}
                ORDER BY codigo ASC
                LIMIT 1
            `;
            if (!setor) {
                console.warn(`Nenhum setor encontrado para a letra ${letra}`);
                continue;
            }

            const [{ totalprodutos: totalProdutos }] = await sql`
                SELECT COUNT(*)::int AS totalprodutos
                FROM products
                WHERE sector_id = ${setor.id}
            `;

            const [{ totalunidades: totalUnidades }] = await sql`
                SELECT COALESCE(SUM(qtdUni), 0)::int AS totalunidades
                FROM products
                WHERE sector_id = ${setor.id}
            `;

            console.log(`Setor ${letra} - Produtos: ${totalProdutos}, Unidades: ${totalUnidades}, qtdUni nova: ${qtdUni}`);

            if (totalProdutos < MAX_PRODUTOS_DISTINTOS && (totalUnidades + qtdUni) <= MAX_UNIDADES) {
                try {
                    await sql`
                        INSERT INTO products (
                            id, productName, validade, description,
                            marca, qtdUni, qtdBox, categoria, sector_id
                        ) VALUES (
                            ${productId},
                            ${productName},
                            ${validade},
                            ${description},
                            ${marca},
                            ${qtdUni},
                            ${qtdBox},
                            ${categoria},
                            ${setor.id}
                        )
                    `;

                    await this.logReport('create', productId, productName, null, qtdBox);
                    console.log(`Produto "${productName}" inserido no setor ${letra} com sucesso.`);
                    return true;
                } catch (err) {
                    console.error("Erro ao criar produto:", err);
                    return false;
                }
            } else {
                console.log(`Setor ${letra} sem capacidade disponível para inserir produto.`);
            }
        }

        console.error("Nenhum setor com capacidade disponível para o produto.");
        return false;
    }

    async findByEmail(email) {
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        return result[0];
    }

    async update(id, user) {
        const { name, email } = user;

        try {
            await sql`
                UPDATE users
                SET name = ${name}, email = ${email}
                WHERE id = ${id}
            `;
        } catch (err) {
            console.error("Erro ao atualizar usuário:", err);
        }
    }

    async updateProduct(id, product) {
        try {
            const [oldData] = await sql`
            SELECT productname, validade, description, marca, qtduni, qtdbox, categoria, sector_id
            FROM products
            WHERE id = ${id}
            `;
            if (!oldData) {
                console.error("Produto não encontrado para atualização.");
                return false;
            }

            const updated = {
                productname: product.productname ?? oldData.productname,
                validade: product.validade ?? oldData.validade,
                description: product.description ?? oldData.description,
                marca: product.marca ?? oldData.marca,
                qtduni: product.qtduni ?? oldData.qtduni,
                qtdbox: product.qtdbox ?? oldData.qtdbox,
                categoria: product.categoria ?? oldData.categoria,
                sector_id: product.sector_id ?? oldData.sector_id,
            };

            // Limpa valores undefined
            for (const key in updated) {
                if (updated[key] === undefined) {
                    delete updated[key];
                }
            }

            const keys = Object.keys(updated);
            if (keys.length === 0) {
                return oldData;
            }

            const values = keys.map((key) => {
                const val = updated[key];
                return val instanceof Date ? val : typeof val === "string" || typeof val === "number" || val === null ? val : String(val);
            });

            const sets = keys.map((key, idx) => `${key} = $${idx + 1}`);

            const queryText = `
            UPDATE products
            SET ${sets.join(', ')}
            WHERE id = $${keys.length + 1}
            RETURNING *;
        `;

            const [result] = await sql.unsafe(queryText, [...values, id]);

            await this.logReport('update', id, oldData.productname, oldData.qtdbox, updated.qtdbox);
            return result;
        } catch (err) {
            console.error("Erro ao atualizar produto:", err);
            return false;
        }
    }

    async delete(id) {
        try {
            await sql`DELETE FROM users WHERE id = ${id}`;
        } catch (err) {
            console.error("Erro ao deletar usuário", err);
        }
    }

    async deleteProduct(id) {
        try {
            const [productData] = await sql`
                SELECT productName, qtdBox FROM products WHERE id = ${id}
            `;
            const productName = productData?.productName;
            const qtdBox = productData?.qtdBox;

            await sql`DELETE FROM products WHERE id = ${id}`;
            await this.logReport('delete', id, productName, qtdBox, null);
        } catch (err) {
            console.error("Erro ao deletar produto:", err);
            throw err;
        }
    }

    async logReport(action, product_id, product_name, oldQtdBox = null, newQtdBox = null) {
        const reportId = randomUUID();

        // Normalização segura
        const safeAction = action ?? null;
        const safeProductId = product_id ?? null;
        const safeProductName = product_name ?? null;
        const safeOldQtdBox = oldQtdBox ?? null;
        const safeNewQtdBox = newQtdBox ?? null;

        try {
            await sql`
                INSERT INTO reports (
                    id, action, product_id, product_name,
                    old_qtdBox, new_qtdBox
                ) VALUES (
                    ${reportId}, ${safeAction}, ${safeProductId}, ${safeProductName},
                    ${safeOldQtdBox}, ${safeNewQtdBox}
                )
            `;
        } catch (err) {
            console.error("Erro ao criar relatório:", err);
        }
    }

    async getReports() {
        try {
            return await sql`SELECT * FROM reports`;
        } catch (err) {
            console.error("Erro ao buscar relatórios:", err);
            return [];
        }
    }

    async getproducts() {
        try {
            return await sql`
            SELECT 
              p.*, 
              s.codigo AS setor 
            FROM products p
            LEFT JOIN sectors s ON p.sector_id = s.id
          `;
        } catch (err) {
            console.error("Erro ao buscar produtos:", err);
            return [];
        }
    }
      

    async getProdutosPorSetor() {
        try {
            return await sql`
                SELECT s.codigo AS setor, COUNT(p.id) AS total_produtos
                FROM sectors s
                LEFT JOIN products p ON p.sector_id = s.id
                GROUP BY s.codigo
                ORDER BY s.codigo;
            `;
        } catch (error) {
            console.error("Erro ao buscar produtos por setor:", error);
            return [];
        }
    }

    // Busca categorias distintas (strings)
    async getCategorias() {
        try {
            return await sql`SELECT DISTINCT categoria FROM products ORDER BY categoria`;
        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            return [];
        }
    }

    // Busca produtos filtrando pela categoria (string)
    async getProdutosPorCategoria(categoria) {
        try {
            return await sql`
                SELECT id, productName as codigo, description as descricao, qtdBox as qtdbox, categoria, sector_id as setor
                FROM products
                WHERE categoria = ${categoria}
                ORDER BY description
            `;
        } catch (err) {
            console.error('Erro ao buscar produtos por categoria:', err);
            return [];
        }
    }

    // Atualiza o setor do produto (mover produto)
    async moverProdutoSetor(produto_id, setor_id) {
        try {
            await sql`
                UPDATE products SET sector_id = ${setor_id} WHERE id = ${produto_id}
            `;
            return true;
        } catch (err) {
            console.error('Erro ao mover produto:', err);
            return false;
        }
    }
    
    async getSetoresReports() {
        try {
            return await sql`
      SELECT
        LOWER(TRIM(p.productname)) AS product_name,
        s.codigo AS setor_nome
      FROM products p
      LEFT JOIN sectors s ON p.sector_id = s.id
    `;
        } catch (err) {
            console.error('Erro ao buscar setores:', err);
            return [];
        }
    }



    async getSetoresPorCategoria(categoria) {
        console.log('Categoria recebida:', categoria);
        const letraMap = {
            'Moda e Acessórios': 'A',
            'Casa e Decoração': 'B',
            'Beleza e Cosméticos': 'C',
            'Alimentos e Bebidas': 'D',
            'Eletrônicos': 'E'
        };

        const letra = letraMap[categoria];
        console.log('Letra mapeada:', letra);
        if (!letra) return [];

        try {
            const setores = await sql`
            SELECT id, codigo AS setor
            FROM sectors
            WHERE codigo LIKE ${letra + '%'}
            ORDER BY codigo
          `;
            console.log('Setores achados:', setores);
            return setores;
        } catch (err) {
            console.error('Erro buscando setores:', err);
            return [];
        }
    }

    async getProdutosPorSetorECategoria(categoria) {
        try {
            return await sql`
                SELECT s.codigo AS setor, p.productname AS produto_nome, p.qtdbox
                FROM products p
                JOIN sectors s ON s.id = p.sector_id
                WHERE p.categoria = ${categoria}
                ORDER BY s.codigo;
            `;
        } catch (err) {
            console.error("Erro ao buscar produtos por setor e categoria:", err);
            return [];
        }
    }

    // Buscar produtos no setor e produto específico (usado na movimentação)
    async getProductsBySetorAndProductId(setorId, produtoId) {
        try {
            return await sql`
                SELECT * FROM products
                WHERE sector_id = ${setorId} AND id = ${produtoId}
                LIMIT 1
            `;
        } catch (err) {
            console.error("Erro ao buscar produto por setor e id:", err);
            return [];
        }
    }

    async getProductByNameAndSetor(name, setor_id) {
        try {
            const result = await sql`
            SELECT * FROM products
            WHERE productname = ${name} AND sector_id = ${setor_id}
          `;
            return result;
        } catch (err) {
            console.error("Erro ao buscar produto por nome e setor:", err);
            return [];
        }
    }

    async getProductByNameAndSetor(name, setor_id) {
        try {
            return await sql`
      SELECT * FROM products
      WHERE productname = ${name} AND sector_id = ${setor_id}
    `;
        } catch (err) {
            console.error("Erro ao buscar produto por nome e setor:", err);
            return [];
        }
    }

    async getResumoEstoquePorSetor(setorId) {
        try {
            const [result] = await sql`
            SELECT 
                COUNT(DISTINCT productname) AS totalprodutosdiferentes,
                COALESCE(SUM(qtdbox * qtduni), 0) AS totalunidades
            FROM products
            WHERE sector_id = ${setorId}
        `;
            return result;
        } catch (err) {
            console.error("Erro ao buscar resumo do estoque:", err);
            return null;
        }
    }

    async createProduct(productData) {
        const {
            productName,
            validade,
            description,
            marca,
            qtdUni,
            qtdBox,
            categoria,
            sector_id // <-- pode vir opcional
        } = productData;

        const productId = randomUUID();

        // Se veio sector_id manual, usar direto:
        if (sector_id) {
            try {
                await sql`
        INSERT INTO products (
          id, productName, validade, description,
          marca, qtdUni, qtdBox, categoria, sector_id
        ) VALUES (
          ${productId},
          ${productName},
          ${validade},
          ${description},
          ${marca},
          ${qtdUni},
          ${qtdBox},
          ${categoria},
          ${sector_id}
        )
      `;
                await this.logReport('create', productId, productName, null, qtdBox);
                return true;
            } catch (err) {
                console.error("Erro ao criar produto com setor definido:", err);
                return false;
            }
        }

        // Lógica padrão de alocação automática
        const letraMap = {
            'Moda e Acessórios': 'A',
            'Casa e Decoração': 'B',
            'Beleza e Cosméticos': 'C',
            'Alimentos e Bebidas': 'D',
            'Eletrônicos': 'E'
        };

        const letras = Object.values(letraMap);
        const letraInicial = letraMap[categoria];
        if (!letraInicial) {
            console.error(`Categoria inválida: ${categoria}`);
            return false;
        }

        const MAX_PRODUTOS_DISTINTOS = 300;
        const MAX_UNIDADES = 5000;

        for (let i = letras.indexOf(letraInicial); i < letras.length; i++) {
            const letra = letras[i];
            const [setor] = await sql`
      SELECT id FROM sectors
      WHERE codigo LIKE ${letra + '%'}
      ORDER BY codigo ASC
      LIMIT 1
    `;
            if (!setor) continue;

            const [{ totalprodutos: totalProdutos }] = await sql`
      SELECT COUNT(*)::int AS totalprodutos
      FROM products
      WHERE sector_id = ${setor.id}
    `;

            const [{ totalunidades: totalUnidades }] = await sql`
      SELECT COALESCE(SUM(qtdUni), 0)::int AS totalunidades
      FROM products
      WHERE sector_id = ${setor.id}
    `;

            if (totalProdutos < MAX_PRODUTOS_DISTINTOS && (totalUnidades + qtdUni) <= MAX_UNIDADES) {
                try {
                    await sql`
          INSERT INTO products (
            id, productName, validade, description,
            marca, qtdUni, qtdBox, categoria, sector_id
          ) VALUES (
            ${productId},
            ${productName},
            ${validade},
            ${description},
            ${marca},
            ${qtdUni},
            ${qtdBox},
            ${categoria},
            ${setor.id}
          )
        `;
                    await this.logReport('create', productId, productName, null, qtdBox);
                    return true;
                } catch (err) {
                    console.error("Erro ao criar produto:", err);
                    return false;
                }
            }
        }

        console.error("Nenhum setor com capacidade disponível para o produto.");
        return false;
    }

    async getMapaStatus() {
        try {
            const setores = await sql`
                SELECT
                    s.codigo,
                    COUNT(DISTINCT p.productName) AS qtd_produtos_distintos
                FROM sectors s
                LEFT JOIN products p ON p.sector_id = s.id
                WHERE LEFT(s.codigo, 1) IN ('A', 'B', 'C', 'D', 'E')
                GROUP BY s.id, s.codigo
                ORDER BY s.codigo
                `;

            return setores.map(s => ({
                codigo: s.codigo,
                setor: s.codigo.charAt(0), // A, B, C, D ou E
                status: s.qtd_produtos_distintos > 1 ? "ocupado" : "livre"
            }));
        } catch (err) {
            console.error("Erro ao gerar mapa de status:", err);
            return [];
        }
    }

}
export default {
    DatabasePostgres
};
