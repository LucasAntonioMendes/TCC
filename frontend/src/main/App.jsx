import React, { useState, useEffect } from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Inicio from "../components/Inicio";
import Cadastro from "../components/Cadastro";
import Gestao from "../components/Gestao";
import Mapeamento from "../components/Mapeamento";
import Movimentacao from "../components/Movimentacao";
import Relatorio from "../components/Relatorio";

import Modal from "../components/Modal";
import logo from "../assets/img/logo2.png";
import usuario from "../assets/img/usuario.png";

import { NotificationProvider } from "../context/NotificationContext";
import VerificadorDeSetores from "../components/VerificadorDeSetores";
import Login from "../components/Login";
import RoleProtected from "../components/RoleProtected"; // Importação do protetor

import "./notification.css";

export default function FluxWareApp() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Recupera a role do usuário logado
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("fluxware_role") || "";
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("fluxware_email");
    const savedPassword = localStorage.getItem("fluxware_password");
    const savedRole = localStorage.getItem("fluxware_role");
    if (savedEmail && savedPassword && savedRole) {
      setUserRole(savedRole);
      setIsLoggedIn(true);
    }
  }, []);

const toggleTheme = () => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
};


  function handleLogin() {
    // Atualize a role após login, lendo do localStorage
    const savedRole = localStorage.getItem("fluxware_role");
    if (savedRole) setUserRole(savedRole);

    setIsLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem("fluxware_email");
    localStorage.removeItem("fluxware_password");
    localStorage.removeItem("fluxware_role"); // Remove role também
    localStorage.removeItem("fluxware_token");
    setUserRole("");
    setIsLoggedIn(false);
  }

  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <NotificationProvider>
          <VerificadorDeSetores />

          <div
            className="app-container"
            style={{
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            {/* HEADER */}
            <header className="header">
              <div className="header-container">
                <div className="logo-area">
                  <img src={logo} alt="Logo da FluxWare" className="logo" />
                </div>

                <nav className="menu">
                  <NavLink to="/Inicio" className="nav-link">
                    Início
                  </NavLink>

                  {(userRole === "admin" || userRole === "estoquista") && (
                    <NavLink to="/Cadastro" className="nav-link">
                      Cadastrar produto
                    </NavLink>
                  )}

                  {(userRole === "admin" || userRole === "estoquista") && (
                    <NavLink to="/Gestao" className="nav-link">
                      Gestão de estoque
                    </NavLink>
                  )}

                  {userRole === "admin" && (
                    <NavLink to="/Mapeamento" className="nav-link">
                      Mapeamento
                    </NavLink>
                  )}

                  {(userRole === "admin" || userRole === "estoquista") && (
                    <NavLink to="/Movimentacao" className="nav-link">
                      Movimentação
                    </NavLink>
                  )}

                  {(userRole === "admin" || userRole === "analista") && (
                    <NavLink to="/Relatorio" className="nav-link">
                      Relatórios
                    </NavLink>
                  )}
                </nav>

                <div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="button-img"
                  >
                    <img src={usuario} alt="Usuário" className="user-avatar" />
                  </button>
                </div>
              </div>
            </header>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="conteudo">
              <Routes>
                <Route path="/login" element={<Navigate to="/Inicio" />} />
                <Route path="/Inicio" element={<Inicio />} />

                {/* Exemplo de bloqueio de seção com RoleProtected: */}
                <Route
                  path="/Cadastro"
                  element={
                    <RoleProtected allowedRoles={["admin", "estoquista"]} userRole={userRole}>
                      <Cadastro />
                    </RoleProtected>
                  }
                />

                <Route
                  path="/Gestao"
                  element={
                    <RoleProtected allowedRoles={["admin", "estoquista"]} userRole={userRole}>
                      <Gestao />
                    </RoleProtected>
                  }
                />

                <Route
                  path="/Mapeamento"
                  element={
                    <RoleProtected allowedRoles={["admin"]} userRole={userRole}>
                      <Mapeamento />
                    </RoleProtected>
                  }
                />

                <Route
                  path="/Movimentacao"
                  element={
                    <RoleProtected allowedRoles={["admin", "estoquista"]} userRole={userRole}>
                      <Movimentacao />
                    </RoleProtected>
                  }
                />

                <Route
                  path="/Relatorio"
                  element={
                    <RoleProtected allowedRoles={["admin", "analista"]} userRole={userRole}>
                      <Relatorio />
                    </RoleProtected>
                  }
                />

                {/* Redireciona qualquer rota desconhecida para Início */}
                <Route path="*" element={<Navigate to="/Inicio" />} />
              </Routes>
            </main>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onToggleTheme={toggleTheme}
              currentTheme={theme}
              onLogout={handleLogout} 
            />
            <ToastContainer position="top-right" autoClose={5000} />
          </div>
        </NotificationProvider>
      )}
    </>
  );
}
