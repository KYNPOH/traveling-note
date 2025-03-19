import React from "react";
import { useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router-dom";
import "./ConfirmationPage.css";

const ConfirmationPage = () => {
  const navigate = useNavigate();

  // スワイプ設定（左から右のスワイプで戻る）
  const handlers = useSwipeable({
    onSwipedRight: () => navigate("/"),
    preventScrollOnSwipe: true,
    trackMouse: true, // PCでもマウスドラッグで動作
  });

  // 画面の左側をクリックすると戻る
  const handleClick = (event) => {
    if (event.clientX < window.innerWidth / 2) {
      navigate("/");
    }
  };

  return (
    <div className="confirmationPage" {...handlers} onClick={handleClick}>
      <h2>Confirmation</h2>
      <p>Please write about today's events freely as you feel.</p>
      <p>Personal information is prohibited from being written.</p>
      <p>The last sentence must be: "Tomorrow will surely be a better day."</p>
      <button onClick={() => alert("Moving to post form...")}>I Agree</button>
    </div>
  );
};

export default ConfirmationPage;
