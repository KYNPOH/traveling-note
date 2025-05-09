import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { HTMLFlipBook } from "../libs/react-pageflip/html-flip-book/index.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import { isValidToken } from "../utils/accessManager"; // ← トークンチェック
import CoverPage from "../components/CoverPage";
import RulePage from "../components/RulePage";
import DiaryPage from "../components/DiaryPage";
import EntryForm from "../components/EntryForm";
import BackCoverPage from "../components/BackCoverPage";
import NotAllowed from "../components/NotAllowed";
import "./DiaryBook.css";

const DiaryBook = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const bookRef = useRef(null);
  const location = useLocation();

  // 初回アクセス時にトークンをチェック
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");
    setIsAuthorized(isValidToken(token));
  }, [location]);

  // 表紙クリックで本を開くアニメーション
  const handleOpenBook = () => {
    setIsOpen(true);
  };

  const [readyToShowBook, setReadyToShowBook] = useState(false);

  useEffect(() => {
    if (showIntroduction) {
      setTimeout(() => setReadyToShowBook(true), 100); // 少し待ってから描画
    }
  }, [showIntroduction]);

  const handleAnimationComplete = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip(); // 実際は pageFlip().flipNext() など
    }
  };

  return (
    <div className="book-container">
      {/* クリックで導入文から本へ遷移 */}
      {!showIntroduction && (
        <motion.div
          className="introduction"
          onClick={() => setShowIntroduction(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          あなたはこのノートの記入者ですか？
        </motion.div>
      )}

      {/* 本の表示 */}
      {showIntroduction && readyToShowBook && (
        /*<motion.div
          className="book-wrapper"
          onClick={!isOpen ? handleOpenBook : null}
          initial={{ x: 0 }}
          animate={isOpen ? { x: 200 } : { x: 0 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={isOpen ? handleAnimationComplete : null}
        >*/
          <HTMLFlipBook
            className="flip-book"
            width={400}
            height={500}
            minWidth={300}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1536}
            showCover={true}
            mobileScrollSupport={true}
            ref={bookRef}
          >
            <div><CoverPage /></div>
            <div><RulePage /></div>
            {/* 仮の過去日記ページをループで表示 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div><DiaryPage key={n} date={`2025-04-0${n}`} content={`日記の内容 ${n}`} /></div>
            ))}
            <div><BackCoverPage /></div>

            {/* 最後のページ：条件で表示を切り替える
            {isAuthorized ? (
              <EntryForm />
            ) : (
              <NotAllowed />
            )} */}
          </HTMLFlipBook>
        /*</motion.div>*/
      )}
    </div>
  );
};

export default DiaryBook;
