"use client";
import React, { useState } from 'react';
import style from './authform.module.css';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'; // Icons aus react-icons

const AuthForm = ({ type }) => {
  const isSignIn = type === "sign-in";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1 className={style.logo}>LOCE<span>EP</span></h1>
        <h2 className={style.title}>{isSignIn ? "Login" : "Register"}</h2>

        <img src="/LOCeepLogo.png" alt="brain" className={style.icon} />

        <form className={style.form}>
          {!isSignIn && (
            <input 
              type="text" 
              placeholder='Name' 
              className={style.input}
              required
            />
          )}
          
          <input 
            type="email" 
            placeholder='E-mail' 
            className={style.input}
            required
          />

          <div className={style.passwordWrapper}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder='Password' 
              className={style.input}
              required
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

        <p className={style.switch}>
          {isSignIn 
            ? <>Don’t have an account? <a href="/register">Register now!</a></> 
            : <>Already have an account? <a href="/login">Log-in now!</a></>
          }
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
