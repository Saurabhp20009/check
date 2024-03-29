import { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar";
import Dashboard from "./Components/Dashboard/Dashboard";

import AuthPage from "./Components/AuthPage/AuthPage";
import Settings from "./Components/SettingsUI/Settings";
import AweberAuthLinkPage from "./Components/AweberAuthLink/AweberAuthLinkPage";

function App() {
  const [checkUserLogin, setCheckUserLogin] = useState(false);

  const handleLogin = () => {
    setCheckUserLogin(true);
  };

  useEffect(() => {
    if (localStorage.getItem("userInfo")) {
      setCheckUserLogin(true);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            !checkUserLogin ? (
              <AuthPage handleLogin={handleLogin} />
            ) : (
              <NavBar />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/aweberauth" element={<AweberAuthLinkPage />} />
      </Routes>
    </>
  );
}

export default App;
