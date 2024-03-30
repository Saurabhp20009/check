import React, { useRef, useState } from "react";
import "./ErrorCards.css";
import { FaChevronCircleDown } from "react-icons/fa";
import { IoIosDownload } from "react-icons/io";
import { IoMdArrowDown } from "react-icons/io";
import { FaArrowDown } from "react-icons/fa";
import { CSVLink } from "react-csv";
import { MdArrowUpward } from "react-icons/md";

const ErrorCards = ({ item }) => {
  const [showTable, setShowTable] = useState(false);

  const handleShowTable = () => {
    setShowTable(!showTable);
  };

  const headers = [
    {
      label: "firstName",
      key: "firstName",
    },
    {
      label: "lastName",
      key: "lastName",
    },
    {
      label: "email",
      key: "email",
    },
  ];

  console.log(item.ErrorRecords);

  return (
    <div className="container">
      <div className="flex-content">
        <div className="content">
          <label>Name</label>
          <p>{item.Name}</p>
        </div>
        <div className="content">
          <label>Sheet Name</label>
          <p>{item.SheetName}</p>
        </div>
        <div className="content">
          <label>{item.WebinarId ? "WebinarId" : "Aweber List Id"}</label>
          <p>{item.WebinarId ? item.WebinarId : item.AweberListId}</p>
        </div>
        <div className="content" onClick={handleShowTable}>
          <label>Show table</label>
          {!showTable ? <IoMdArrowDown /> : <MdArrowUpward />}
        </div>

        <div className="content">
          <IoIosDownload className="downloadIcon" />
          <CSVLink
            data={item.ErrorRecords}
            headers={headers}
            filename={`${item.Name}.csv`}
            className="downloadCSV"
          >
            Download CSV{" "}
          </CSVLink>
        </div>
      </div>

      {showTable && (
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Total Records {item.ErrorRecords.length}</th>
            </tr>
          </thead>
          <tbody>
            {item.ErrorRecords.map((item) => (
              <tr key={item.id}>
                <td>{item.firstName}</td>
                <td>{item.lastName}</td>
                <td>{item.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <CSVLink
        data={item.ErrorRecords}
        headers={headers}
        filename={`${item.Name}.csv`}
      />
    </div>
  );
};

export default ErrorCards;
