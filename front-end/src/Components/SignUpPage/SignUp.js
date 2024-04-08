import React, { useState } from "react";
import "../SignUpPage/SignUp.css";
import { Link } from "react-router-dom";
import emailValidator from "email-validator";
import zxcvbn from "zxcvbn";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const Signup = ({handleSignUp }) => {
  const [formData, setFormData] = useState({
    email: null,
    username: null,
    password: null,
    confirm_password: null,
  });
  const [errors, setErrors] = useState({
    emailError: "Please Enter Your Email",
    passwordError: "Please Enter Your Password",
    usernameError: "Please Enter Your Username",
    confirm_passwordError: "Please Enter Your Confirm Password",
  });
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);
  const [displaySubmitError, setDisplaySubmitError] = useState("");

  const handleSubmit = async () => {
    if (
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.confirm_password
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const passwordScore = zxcvbn(formData.password).score;
    const emailValidationCheck = emailValidator.validate(formData.email);

    if (
      emailValidationCheck &&
      passwordScore >= 2 &&
      formData.username &&
      formData.password === formData.confirm_password
    ) {
      const requestResult= await axios.post("http://connectsyncdata:5000/user/api/signup", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
   
      if(requestResult.data.status!==200)
      {
        toast.error(requestResult.data.message)
      }
      else{
        toast.success("User created successfully, please login")
      }

    } else {
      if (!emailValidationCheck) {
        toast.error("Invalid Email");
      } else if (passwordScore < 2) {
        toast.error("Password is too weak");
      } else {
        toast.error("Password is not matching");
      }

    }
  };

  return (
    <div className="container-signup">
      <div className="container-innerBox">
        <div className="container-innerBox-form">
          <div className="container-innerBox-headings">
            <h3>Create New Account</h3>
            <p>Get your free account now</p>
          </div>

          <div className="form">
            <label>Email</label>
            <input
              className={`inputClass  ${!formData.email && formData.email!==null && "inputErrors"}   `}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email"
            />
            {!formData.email &&formData.email!==null && (
              <div className="errors">{errors.emailError}</div>
            )}

            <label>Username</label>
            <input
              className={`inputClass  ${!formData.username && formData.username!==null && "inputErrors"}   `}
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Enter Username"
            />
            {!formData.username && formData.username!==null && (
              <div className="errors">{errors.usernameError}</div>
            )}

            <label>Password</label>

            <div className="form-input-password">
              <input
                className={`inputClass  ${!formData.password&& formData.password!==null && "inputErrors"}`}
                type={"text"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter Password"
              />
            </div>
            {!formData.password && formData.password!==null && (
              <div className="errors"> {errors.passwordError}</div>
            )}

            <label>Confirm Password</label>

            <div className="form-input-password">
              <input
                className={`inputClass  ${
                  !formData.confirm_password && formData.confirm_password !==null && "inputErrors"
                }`}
                type={"text"}
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                placeholder="Enter Confirm Password"
              />
            </div>
            {!formData.confirm_password && formData.confirm_password !==null && (
              <div className="errors"> {errors.confirm_passwordError}</div>
            )}

            {showSubmitErrors && (
              <div className="errors">{displaySubmitError}</div>
            )}

            <div className="form-button-div">
              <button onClick={handleSubmit}>Sign In</button>
            </div>
          </div>
        </div>
        <div className="footer">
          <h5>
            Already have an account ? <Link onClick={handleSignUp}>Signin</Link>
          </h5>
        </div>
      </div>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default Signup;
