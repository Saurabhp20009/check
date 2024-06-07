import React from "react";
import "./Training.css";

import { experimentalStyled as styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import MediaCard from "./MediaCard";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  borderRadius: "5px",
  borderWidth: " ",
  backgroundColor: "#ffffff",
}));

const Training = () => {
  const AccountConnectVideos = [
    {
      url: "https://drive.google.com/file/d/16gPyJt8ayiG9cubDV-oS4NAdRPGny-WF/preview",
      title: "Connect aweber",
    },
    {
      url: "https://drive.google.com/file/d/1V8g4G1kYEhpVflHnAVRvIHvKwleCMAov/preview",
      title: "Connect google",
    },
    {
      url: "https://drive.google.com/file/d/1yy8FtGP1wNnIJ5X1yF79E2itsreo9oiS/preview",
      title: "Connect bigmarker",
    },
    {
      url: "https://drive.google.com/file/d/1AMz4TQ1f7e0jgjE--aawrhtdDucw4gBk/preview",
      title: "Connect brevo",
    },
    {
      url: "https://drive.google.com/file/d/1j9QvVvjLcrYH5oSUsgR7zCNN_b8gIOmE/preview",
      title: "Connect gotowebinar",
    },
    {
      url: "https://drive.google.com/file/d/1vS21gsrEYYouwZQZcKz1JB_9VDcWtZJP/preview",
      title: "Connect getresponse",
    },
    {
      url: "https://drive.google.com/file/d/1QqrPGbxXY-d74KRoq06dDQWBbhkAF_nY/preview",
      title: "Connect sendy ",
    },
    {
      url: "https://drive.google.com/file/d/1b8s1-CiBAKSqEu4TtGJlpFJb89QZGh2r/preview",
      title: "Sheet to aweber",
    },

    {
      url: "https://drive.google.com/file/d/1i-E7frOAm28iNofm4u5o1JlQnSVP9oSY/preview",
      title: "Sheet to aweber (delete subscribers)",
    },
    {
      url: "https://drive.google.com/file/d/1ziBxWALLEISE_G4XsnJE8BYYotnwcmPB/preview",
      title: "Bigmarker all integrations",
    },
    {
      url: "https://drive.google.com/file/d/1Mt3gifz_cD9SIVu57s4OnjSNloBjQ3IO/preview",
      title: "Sheet to brevo",
    },
    {
      url: "https://drive.google.com/file/d/1LLuF-0a-omQBvYpQ2u-I8qffyS7Hg1FP/preview",
      title: "Sheet to getresponse",
    },
    {
      url: "https://drive.google.com/file/d/1nnPeLljLoeM05ho-HNUFJ_MinvkZZj8e/preview",
      title: "Gotowebinar all integrations",
    },
    {
      url: "https://drive.google.com/file/d/11I6oaCkt6rDH0WjI-pkO1DGyXbEs3IdI/preview",
      title: "Sheet to sendy",
    },
    {
      url: "https://drive.google.com/file/d/1BOm-h9u0Q12hDet0jl80RnKea7GUKXod/preview",
      title: "Error records in sheet",
    },
  ];

  return (
    <div style={{ margin: "0 1vh 0 1vh" }}>
      <div className="Traning-outside-container">
        <h2 id="main-heading">Training Videos</h2>
      </div>

      <div style={{ padding: "5vh 20vh ", minWidth: "100%" }}>
        <div>
          <Box sx={{ flexGrow: 1, borderWidth: "none" }}>
            <Grid
              container
              spacing={{ xs: 1, md: 3 }}
              columns={{ xs: 2, sm: 8, md: 10 }}
            >
              {Array.from(AccountConnectVideos).map((item, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>
                  <Item>
                    {console.log(item)}
                    <MediaCard source={item.url} title={item.title} />{" "}
                  </Item>
                </Grid>
              ))}
            </Grid>
          </Box>
        </div>
      </div>
    </div>
  );
};

export default Training;
