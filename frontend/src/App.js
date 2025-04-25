import React from "react";
import DiaryBook from "./pages/DiaryBook";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <DiaryBook />
    </div>
  );
}

export default App;
