import { useState } from "react";
import "../styles/login.css";

function LoginPage() {

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        setError("");

        if (!form.email || !form.password) {

            setError("Todos los campos son obligatorios");

            return;
        }

        console.log(form);

    };

    return (

        <div className="login-root">

            {/* LEFT PANEL */}
            <div className="login-left">

                <div className="brand-logo">

                    <div className="brand-logo-icon">
                        🎓
                    </div>

                    <div className="brand-logo-text">
                        <h2>UTA</h2>
                        <p>Universidad Técnica de Ambato</p>
                    </div>

                </div>

                <div className="monitor-icon">
                    🖥️
                </div>

                <div className="left-headline">

                    <h1>
                        Sistema de
                        <br />
                        Service Desk
                    </h1>

                    <p>
                        Soporte técnico institucional para la comunidad universitaria UTA
                    </p>

                </div>

                <div className="features">

                    <div className="feature-item">

                        <div className="feature-icon">
                            ⚡
                        </div>

                        Resolución rápida de incidentes

                    </div>

                    <div className="feature-item">

                        <div className="feature-icon">
                            🔒
                        </div>

                        Seguridad y privacidad garantizadas

                    </div>

                    <div className="feature-item">

                        <div className="feature-icon">
                            🌐
                        </div>

                        Disponible las 24 horas, 7 días

                    </div>

                </div>

                <div className="left-footer">
                    DTIC — Dirección de Tecnologías de la Información y Comunicación
                </div>

            </div>

            {/* RIGHT PANEL */}
            <div className="login-right">

                <div className="login-form-wrapper">

                    <h2>Bienvenido de vuelta</h2>

                    <p className="subtitle">
                        Ingresa con tu correo institucional
                    </p>

                    {
                        error &&
                        <div className="error-msg">
                            {error}
                        </div>
                    }

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">

                            <label>
                                Correo institucional
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    ✉️
                                </span>

                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    placeholder="usuario@uta.edu.ec"
                                    value={form.email}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Contraseña
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    🔒
                                </span>

                                <input
                                    className="form-input"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <button
                            className="btn-submit"
                            type="submit"
                        >
                            Iniciar Sesión
                        </button>

                    </form>

                    <p className="register-link">
                        ¿No tienes cuenta?
                        <a href="#"> Regístrate</a>
                    </p>


                </div>

                <div className="right-footer">
                    Service Desk UTA v2.4.1 · © 2026 DTIC
                </div>

            </div>

        </div>

    );
}

export default LoginPage;