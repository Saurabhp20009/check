import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function MediaCard({ source, title }) {

  
  const handleClick=()=>{
  window.open(source)

  }

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <div style={{ borderRadius: "5px" }}  >
        <a href={source}> <iframe height="360" width="640" src={source}  style={{ border: 'none' }} controls  ></iframe></a>
      </div>
      <CardContent style={{ backgroundColor: "#ffffff", border: "none", cursor:"pointer" }} onClick={handleClick}  > 
        <Typography gutterBottom variant="h6" component="div" fontFamily={"sans-serif"}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}
