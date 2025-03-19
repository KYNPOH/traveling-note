import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CoverPage from "./components/CoverPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoverPage />} />
      </Routes>
    </Router>
  );
}

export default App;
