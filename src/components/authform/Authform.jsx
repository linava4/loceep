import React from 'react'
import style from './authform.module.css'

const AuthForm = ({ type }) => {
  const isSignIn = type === "sign-in";

  return (
    <div className={style.container}>
      <div >
        {/* Logo */}
       
      </div>

      <form className={style.form}>
        {/* Nur anzeigen bei Sign-up */}
        {!isSignIn && (
          <>
            <input 
                type="text" 
                placeholder='username' 
                className={style.input}
                required
            />
            <input 
                type="date" 
                placeholder='birthdate' 
                className={style.input}
                required
            />
          </>
        )}

        {/* Gemeinsam genutzte Felder */}
        <input 
          type="email" 
          placeholder='email' 
          className={style.input}
          required
        />
        <input 
          type="password" 
          placeholder='password' 
          className={style.input}
          required
        />
        <button className={style.button} type="submit">
          {isSignIn ? "Sign in" : "Create an Account"}
        </button>
      </form>

      <p>
        {isSignIn ? "No Account Yet?" : "Have an Account already?"}
        <a href={isSignIn ? "/dashboard/register" : "/dashboard/login"}>
          {isSignIn ? "Sign up" : "Sign in"}
        </a>
      </p>
    </div>
  );
};

export default AuthForm;
