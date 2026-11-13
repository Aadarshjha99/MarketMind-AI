
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    BrainCircuit,
    TrendingUp
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "./Auth.css";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const registered = location.state?.registered;

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            await login(formData.email.trim(), formData.password);

            navigate("/app", { replace: true });
            {registered && (
                <div className="auth-success">
                    Account created successfully! You can now sign in.
                </div>
            )}
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-background-glow"></div>

            {/* Brand */}
            <Link to="/" className="auth-brand">
                <div className="auth-brand-logo">M</div>

                <span>
                    MarketMind <strong>AI</strong>
                </span>
            </Link>

            <div className="auth-container">

                {/* Left Panel */}
                <div className="auth-showcase">

                    <div className="auth-showcase-content">

                        <div className="auth-showcase-icon">
                            <BrainCircuit size={28} />
                        </div>

                        <span className="auth-eyebrow">
                            INTELLIGENCE MEETS INVESTING
                        </span>

                        <h1>
                            Make every
                            <br />
                            market move
                            <br />
                            <span>count.</span>
                        </h1>

                        <p>
                            Access intelligent stock analysis, market
                            insights and data-driven tools designed to
                            help you understand the market better.
                        </p>

                        <div className="auth-showcase-stat">
                            <TrendingUp size={19} />

                            <div>
                                <strong>One intelligent workspace</strong>
                                <span>
                                    Research. Analyze. Understand.
                                </span>
                            </div>
                        </div>

                    </div>

                    <div className="auth-showcase-footer">
                        MARKETMIND AI · SMARTER MARKET INTELLIGENCE
                    </div>

                </div>

                {/* Login Form */}
                <div className="auth-form-panel">

                    <div className="auth-form-heading">
                        <span>WELCOME BACK</span>
                        <h2>Sign in to your account</h2>

                        <p>
                            Enter your credentials to access your
                            MarketMind workspace.
                        </p>
                    </div>

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="auth-field">
                            <label htmlFor="login-email">
                                Email address
                            </label>

                            <div className="auth-input-wrapper">
                                <Mail size={17} />

                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">
                                Password
                            </label>

                            <div className="auth-input-wrapper">
                                <LockKeyhole size={17} />

                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword
                                        ? <EyeOff size={17} />
                                        : <Eye size={17} />
                                    }
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <ArrowRight size={17} />}
                        </button>

                    </form>

                    <div className="auth-switch">
                        Don't have an account?

                        <Link to="/register">
                            Create account
                        </Link>
                    </div>

                    <div className="auth-secure-note">
                        <LockKeyhole size={13} />
                        Your account credentials are securely handled.
                    </div>

                </div>

            </div>

            <footer className="auth-page-footer">
                © {new Date().getFullYear()} MarketMind AI. All rights reserved.
            </footer>

        </div>
    );
}

export default Login;
