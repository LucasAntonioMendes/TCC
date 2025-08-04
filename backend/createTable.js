import { sql } from './sql.js';
import { randomUUID } from 'node:crypto';

export async function createTablesAndSeed() {
    // Criar tabela sectors
    await sql`
    CREATE TABLE IF NOT EXISTS sectors (
      id UUID PRIMARY KEY,
      codigo VARCHAR(10) UNIQUE NOT NULL,
      descricao VARCHAR(100) NOT NULL
    )
  `;

    // Criar tabela users
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'user'
    )
  `;

    // Criar tabela products
    await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      productName TEXT NOT NULL,
      validade DATE,
      description VARCHAR(1500),
      marca TEXT,
      qtdUni INTEGER,
      qtdBox INTEGER,
      categoria TEXT CHECK (
        categoria IN (
          'Moda e Acessórios',
          'Casa e Decoração',
          'Beleza e Cosméticos',
          'Alimentos e Bebidas',
          'Eletrônicos'
        )
      ),
      sector_id UUID REFERENCES sectors(id)
    )
  `;

    // Popular setores A1 até E5
    const categorias = {
        A: 'Moda e Acessórios',
        B: 'Casa e Decoração',
        C: 'Beleza e Cosméticos',
        D: 'Alimentos e Bebidas',
        E: 'Eletrônicos'
    };

    const numeros = [1, 2, 3, 4, 5];

    for (const letra in categorias) {
        for (const numero of numeros) {
            const codigo = `${letra}${numero}`;
            const descricao = categorias[letra];
            const id = randomUUID();

            await sql`
        INSERT INTO sectors (id, codigo, descricao)
        VALUES (${id}, ${codigo}, ${descricao})
        ON CONFLICT (codigo) DO NOTHING
      `;
        }
    }
}
await sql`
CREATE TABLE IF NOT EXISTS reports(
    id UUID PRIMARY KEY,
    action TEXT NOT NULL, --create, update, delete, partial - remove
    product_id UUID,
    product_name TEXT,
    old_qtdBox INTEGER,
    new_qtdBox INTEGER,
    performed_at TIMESTAMP DEFAULT NOW()
)`;

