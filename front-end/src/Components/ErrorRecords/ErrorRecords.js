import React, { useEffect, useState } from "react";
import "../ErrorRecords/ErrorRecords.css";
import axios from "axios";
import ErrorCards from "./ErrorCards";

const ErrorRecords = () => {
  const [workFlows, setWorkFlows] = useState([]);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  const getWorkFlows = async () => {
    await axios
      .get(`http://localhost:8000/user/api/get/workflows?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => {
        setWorkFlows([...response.data.Workflows]);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    getWorkFlows();
  }, []);

  console.log(workFlows);

  return (
    <div>
      <div className="heading">Error Records</div>

      {workFlows &&
        workFlows.map((item, index) => <ErrorCards key={index} item={item} />)}
    </div>
  );
};

export default ErrorRecords;
