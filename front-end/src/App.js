import { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar";
import Dashboard from "./Components/Dashboard/Dashboard";

import AuthPage from "./Components/AuthPage/AuthPage";
import Settings from "./Components/SettingsUI/Settings";
import AweberAuthLinkPage from "./Components/AweberAuthLink/AweberAuthLinkPage";
import ErrorRecords from "./Components/ErrorRecords/ErrorRecords";
import DisplayWorkflows from "./Components/DashboardPages/DisplayWorkflows";
import BrevoAuthPage from "./Components/AutomationCard/Brevo/AuthPage";
import GoToWebinarAuthPage from "./Components/AutomationCard/GoToWebinar/AuthPage";
import GetResponseAuthPage from "./Components/AutomationCard/GetResponse/AuthPage";
import BigmarkerAuthPage from "./Components/AutomationCard/Bigmarker/AuthPage";
import SendyAuthPage from "./Components/AutomationCard/Sendy/AuthPage";
import Training from "./Components/TraningPage/Training";

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
          <Route index element={<Dashboard />}/>
            <Route path="/workflows" element={<DisplayWorkflows />} />
            <Route path="/error" element={<ErrorRecords />} />
            <Route path="/training" element={<Training />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/aweberauth" element={<AweberAuthLinkPage />} />
        <Route path="/auth/brevo" element={<BrevoAuthPage />} />
        <Route path="/auth/gtw" element={<GoToWebinarAuthPage />} />
        <Route path="/auth/get/response" element={<GetResponseAuthPage />} />
        <Route path="/auth/bigmarker" element={<BigmarkerAuthPage />} />
        <Route path="/auth/sendy" element={<SendyAuthPage />} />

      </Routes>
    </>
  );
}

export default App;
