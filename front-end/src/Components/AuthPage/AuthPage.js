import React, { useState } from 'react'
import LoginInPage from '../LoginInPage/LoginInPage'
import SignUp from '../SignUpPage/SignUp'

const AuthPage = ({handleLogin}) => {
  
    const [signup,setSignUp]=useState(false)
  
    const handleSignUp=()=>{
          setSignUp(!signup)
    }


  return (
    <>{
        !signup ? <LoginInPage handleLogin={handleLogin} handleSignUp={handleSignUp}/> : <SignUp handleSignUp={handleSignUp}/>
    }</>
    
  )
}

export default AuthPage