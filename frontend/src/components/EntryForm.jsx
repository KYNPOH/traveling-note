import React from "react";

const EntryForm = () => {
  return (
    <div className="page">
      <h2>今日あった出来事を記入してください</h2>
      <textarea placeholder="ここに日記を記入..." style={{ width: "100%", height: "200px" }} />
      <p style={{ marginTop: "1rem" }}>
        ※ 最後の一文は「明日はきっと、もっといい一日になる」で終えてください。
      </p>
      <button style={{ marginTop: "1rem" }}>送信</button>
    </div>
  );
};

export default EntryForm;
