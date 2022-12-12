import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


    // "deploy": "react-scripts build && aws s3 rm s3://chit-chat --recursive && aws s3 cp ./build s3://chit-chat --recursive --acl public-read"
