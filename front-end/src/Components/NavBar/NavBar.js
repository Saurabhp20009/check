import { React, useContext, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import "../NavBar/NavBar.css";
import { FaUserCircle } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";
import { RiLogoutBoxRFill } from "react-icons/ri";
import { BsSliders } from "react-icons/bs";
import { MyContext } from "../Context/Context";

const NavBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.reload();
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar__left">
          <h1> Dashboard</h1>
          <BsSliders className="top-nav-icon" />
        </div>
        <div className="navbar__right">
          <div className="user">
            <FaUserCircle className="user-icon"></FaUserCircle>
            <div className="dropdown">
              <h6>Welcome {user.username}</h6>
              <ul>
                <li>
                  <Link to={"/settings"} className="link">
                    <IoSettings /> Settings
                  </Link>
                </li>
                <li onClick={handleLogout}>
                  <RiLogoutBoxRFill /> Logout
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
};

export default NavBar;
