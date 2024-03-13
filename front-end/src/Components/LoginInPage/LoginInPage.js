import React, { useState } from "react";
import "../LoginInPage/LoginInPage.css";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import emailValidator from "email-validator";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginInPage = ({ handleLogin, handleSignUp }) => {
  //hooks
  const [passwordVisibility, setPasswordVisibilty] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({
    emailError: "Please Enter Your Email",
    passwordError: "Please Enter Your Password",
  });

  const handlePasswordVisibility = () => {
    setPasswordVisibilty(!passwordVisibility);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    const emailValidationCheck = emailValidator.validate(formData.email);

    if (emailValidationCheck) {
      const requestResult = await axios.post(
        "http://localhost:8000/user/api/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );
      console.log(requestResult.data.message);

      if (requestResult.data.status !== 200) {
        toast.error(requestResult.data.message);
        
      }     
      
      else{
        localStorage.setItem("userInfo",JSON.stringify(formData))
        handleLogin();
      }

    } else {
      if (!emailValidationCheck) {
        toast.error("Invalid email");
      }


    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;

    if (!value) {
    } else {
      setFormData({ ...formData, name: value });
    }
  };

  return (
    <div className="container-login">
      <div className="container-innerBox">
        <div className="container-innerBox-form">
          <div className="container-innerBox-headings">
            <h3>Welcome Back !</h3>
            <p>Sign in to continue.</p>
          </div>

          <div className="form">
            <label>Email</label>
            <input
              className={`inputClass  ${!formData.email && "inputErrors"}   `}
              type="email"
              value={formData.email}
              name="email"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email"
            />
            {!formData.email && (
              <div className="errors">{errors.emailError}</div>
            )}

            <label>Password</label>

            <div className="form-input-password">
              <input
                className={`inputClass  ${!formData.password && "inputErrors"}`}
                type={!passwordVisibility ? "password" : "text"}
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter Password"
              />
              <span>
                {!passwordVisibility ? (
                  <FaEye onClick={handlePasswordVisibility} />
                ) : (
                  <FaEyeSlash onClick={handlePasswordVisibility} />
                )}
              </span>
            </div>
            {!formData.password && (
              <div className="errors"> {errors.passwordError}</div>
            )}

            <div className="form-button-div">
              <button onClick={handleSubmit}>Sign In</button>
            </div>
          </div>
        </div>
        <div className="footer">
          <h5>
            Don't have an account ? <Link onClick={handleSignUp}>Signup</Link>
          </h5>
        </div>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default LoginInPage;
