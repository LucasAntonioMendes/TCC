import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3001/auth/login", {
        email,
        password
      });

      const { token, user } = response.data;

      // Guarda token e infos no castelo local
      localStorage.setItem("fluxware_token", token);
      localStorage.setItem("fluxware_user", JSON.stringify(user));
      localStorage.setItem("fluxware_role", user.role);

      // Avançai, ó Rei!
      onLogin();
    } catch (err) {
      console.error("Erro ao tentar login:", err);

      if (err.response && err.response.data && err.response.data.msg) {
        setErro(err.response.data.msg);
      } else {
        setErro("Erro ao conectar com o servidor.");
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="logo">
          Flux<span>Ware</span>
        </h1>
        <h2>Entrar na sua conta</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            placeholder="seuemail@empresa.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            placeholder="Digite sua senha"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {erro && <p className="erro-login">{erro}</p>}

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
