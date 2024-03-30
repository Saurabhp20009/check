import React, { createContext, useContext, useState , } from "react";

export const MyContext = createContext();

export  const Context = ({ children }) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  return (
    <MyContext.Provider value={{ isSideBarOpen,setIsSideBarOpen }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
    return useContext(MyContext);
  };
