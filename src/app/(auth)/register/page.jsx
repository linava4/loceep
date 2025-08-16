"use client"

import React from 'react'
import style from '../../page.module.css'
import Link from 'next/link'
import AuthForm from '@/components/authform/Authform'

const Register = () => {
  return (
    <AuthForm type = "sign-up" />
  )
}

export default Register