import { React, useState } from "react";
import { Link, Outlet} from "react-router-dom";
import "../NavBar/NavBar.css";
import { FaUserCircle } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";
import { RiLogoutBoxRFill } from "react-icons/ri";

const NavBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
 
  const handleLogout=()=>{
    localStorage.removeItem("userInfo")
    window.location.reload();
  }

   
  return (
    <div>
      <nav className="navbar">
        <div className="navbar__left">
          <h1> Dashboard</h1>
        </div>
        <div className="navbar__right">
          <div className="user" onClick={toggleDropdown}>
            <FaUserCircle className="user-icon" />
            {isDropdownOpen && (
              <div className="dropdown">
                <h6>Welcome</h6>

                <ul>
                  <li>
                    {" "}
                    <Link to={"/settings"} className="link"><IoSettings /> Settings</Link>
                  </li>
                  <li onClick={handleLogout}>
                    <RiLogoutBoxRFill  /> Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
};

export default NavBar;
