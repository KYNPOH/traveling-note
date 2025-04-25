// src/components/NotAllowed.jsx
import React from "react";

const NotAllowed = () => {
  return (
    <div className="not-allowed-page">
      <h2>このノートにはすでに誰かが記入しました</h2>
      <p>あなたは記入者ではありません。</p>
      <p>過去の記録を読むには、購入ページへお進みください。</p>
    </div>
  );
};

export default NotAllowed;
