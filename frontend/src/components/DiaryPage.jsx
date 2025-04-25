import React from "react";

const DiaryPage = ({ date, content }) => {
  return (
    <div className="DiaryPage">
      <h3>{date}</h3>
      <p>{content}</p>
    </div>
  );
};

export default DiaryPage;
