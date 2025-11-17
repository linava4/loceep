"use client";
import React, { useState } from "react";
import style from "./authform.module.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const AuthForm = ({ type }) => {
  const isSignIn = type === "sign-in";

  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const endpoint = isSignIn ? "/api/auth/login" : "/api/auth/register";

    const payload = isSignIn
      ? { email, password }
      : { firstname, surname, birthdate, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(data.message);

      // Optional: Redirect nach Login
      if (isSignIn) {
        window.location.href = "/profile";
      }
      else {
        // Nach Registrierung zum Login weiterleiten
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);   
      }
    } catch (err) {
      setError("Server error");
    }
  }

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1 className={style.logo}>
          LOCE<span>EP</span>
        </h1>
        <h2 className={style.title}>{isSignIn ? "Login" : "Register"}</h2>

        <img src="/LOCeepLogo.png" alt="brain" className={style.icon} />

        <form className={style.form} onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Firstname"
                className={style.input}
                required
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
              />

              <input
                type="text"
                placeholder="Surname"
                className={style.input}
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />

              <input
                type="date"
                className={style.input}
                required
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="E-mail"
            className={style.input}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className={style.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={style.input}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className={style.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </span>
          </div>

          <button className={style.button} type="submit">
            {isSignIn ? "Login" : "Register"}
          </button>
        </form>

        {error && <p className={style.error}>{error}</p>}
        {success && <p className={style.success}>{success}</p>}

        <p className={style.switch}>
          {isSignIn ? (
            <>
              Don’t have an account? <a href="/register">Register now!</a>
            </>
          ) : (
            <>
              Already have an account? <a href="/login">Log-in now!</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
