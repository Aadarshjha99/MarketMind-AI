
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    UserRound,
    BrainCircuit
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "./Auth.css";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
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

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password
        ) {
            setError("Please complete all required fields.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            await register(
                formData.name.trim(),
                formData.email.trim(),
                formData.password
            );

            navigate("/login", {
                replace: true,
                state: {
                    registered: true,
                    email: formData.email.trim()
                }
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-background-glow"></div>

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
                            YOUR INTELLIGENT MARKET COMPANION
                        </span>

                        <h1>
                            Discover
                            <br />
                            a smarter way
                            <br />
                            to <span>invest.</span>
                        </h1>

                        <p>
                            Bring market research, stock analysis,
                            technical indicators and AI-powered
                            intelligence into one workspace.
                        </p>

                        <div className="auth-benefits">

                            <div>
                                <span>01</span>
                                <p>Explore market trends</p>
                            </div>

                            <div>
                                <span>02</span>
                                <p>Understand stock performance</p>
                            </div>

                            <div>
                                <span>03</span>
                                <p>Make data-driven decisions</p>
                            </div>

                        </div>

                    </div>

                    <div className="auth-showcase-footer">
                        MARKETMIND AI · SMARTER MARKET INTELLIGENCE
                    </div>

                </div>

                {/* Register Form */}
                <div className="auth-form-panel">

                    <div className="auth-form-heading">
                        <span>GET STARTED</span>
                        <h2>Create your account</h2>

                        <p>
                            Join MarketMind AI and explore your
                            intelligent market workspace.
                        </p>
                    </div>

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="auth-field">
                            <label htmlFor="register-name">
                                Full name
                            </label>

                            <div className="auth-input-wrapper">
                                <UserRound size={17} />

                                <input
                                    id="register-name"
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">
                                Email address
                            </label>

                            <div className="auth-input-wrapper">
                                <Mail size={17} />

                                <input
                                    id="register-email"
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
                            <label htmlFor="register-password">
                                Password
                            </label>

                            <div className="auth-input-wrapper">
                                <LockKeyhole size={17} />

                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={6}
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

                        <div className="auth-field">
                            <label htmlFor="register-confirm-password">
                                Confirm password
                            </label>

                            <div className="auth-input-wrapper">
                                <LockKeyhole size={17} />

                                <input
                                    id="register-confirm-password"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required
                                />
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
                            {loading ? "Creating account..." : "Create Account"}
                            {!loading && <ArrowRight size={17} />}
                        </button>

                    </form>

                    <div className="auth-switch">
                        Already have an account?

                        <Link to="/login">
                            Sign in
                        </Link>
                    </div>

                    <div className="auth-secure-note">
                        <LockKeyhole size={13} />
                        Your account information is protected.
                    </div>

                </div>

            </div>

            <footer className="auth-page-footer">
                © {new Date().getFullYear()} MarketMind AI. All rights reserved.
            </footer>

        </div>
    );
}

export default Register;