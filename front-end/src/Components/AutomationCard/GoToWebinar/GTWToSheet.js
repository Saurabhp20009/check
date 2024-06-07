import React from 'react'
import "./AutomationCard.css"; // Import CSS for styling


const GTWToSheet = () => {
  return (
    <div>
            <div className="input-group">
        <label htmlFor="spreadsheetId"> Select Spreadsheet</label>

        <select
          id="aweberList"
          value={spreadsheetId}
          onChange={handleSpreadsheetIdChange}
        >
          {googleSpreadDataList.map((item, index) => (
            <option key={index} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="sheetName">Select the Sheet</label>
        <select
          id="aweberList"
          value={sheetName}
          onChange={handleSheetNameChange}
        >
          {googleSpreadDataSheetList.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

     

      <div className="input-group">
        <label htmlFor="aweberList">Enter Webinar ID</label>
        <input
          value={WebinarId}
          className="NameInput"
          onChange={handleWebinarId}
        />
      </div>

    </div>
  )
}

export default GTWToSheet