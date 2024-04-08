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
      .get(`http://connectsyncdata:5000/user/api/get/workflows?email=${user.email}`, {
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

      {workFlows.length>0 ?
        workFlows.map((item, index) => <ErrorCards key={index} item={item} />) : <h1 className="no-workflow-found">No error records found!</h1>}
    </div>
  );
};

export default ErrorRecords;
