import axios from "axios";
import React, { useEffect, useState } from "react";
import ExistingWorkFlows from "../AutomationCard/ExistingWorkFlows";

const DisplayWorkflows = () => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [workFlows, setWorkFlows] = useState([]);

  const headers = {
    Authorization: `Bearer ${user.token} `,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    getWorkFlows();
  }, []);

  const getWorkFlows = async () => {
    await axios
      .get(`http://connectsyncdata.com:5000/user/api/get/workflows?email=${user.email}`, {
        headers: headers,
      })
      .then((response) => {
        setWorkFlows([...response.data.Workflows]);
      })
      .catch((error) => console.log(error));
  };
  return (
    <div>
      {workFlows &&
        workFlows.map((item, index) => {
          return <ExistingWorkFlows key={index} item={item} />;
        })}
    </div>
  );
};

export default DisplayWorkflows;
