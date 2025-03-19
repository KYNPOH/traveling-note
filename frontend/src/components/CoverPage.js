import React, { useEffect, useRef, useState } from "react";
import "./CoverPage.css";

const CoverPage = () => {
  const canvasRef = useRef(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCover(ctx, canvas, 0);
  }, []);

  const drawCover = (ctx, canvas, progress) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const coverWidth = canvas.width * 0.5;
    const coverHeight = canvas.height * 0.7;
    const coverX = (canvas.width - coverWidth) / 2 + progress * (canvas.width / 2);
    const coverY = (canvas.height - coverHeight) / 2;
    
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(coverX, coverY, coverWidth, coverHeight);
    
    ctx.fillStyle = "#FFF";
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.fillText("a traveling note", coverX + coverWidth / 2, coverY + coverHeight / 2);
  };

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    let step = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animateMoveRight = () => {
      step += 0.02;
      setProgress(step);
      drawCover(ctx, canvas, step);

      if (step < 1) {
        requestAnimationFrame(animateMoveRight);
      } else {
        animatePageFlip();
      }
    };

    const animatePageFlip = () => {
      let flipProgress = 0;
      const flip = () => {
        flipProgress += 0.02;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const coverWidth = canvas.width * 0.5 * (1 - flipProgress);
        const coverHeight = canvas.height * 0.7;
        const coverX = canvas.width / 2;
        const coverY = (canvas.height - coverHeight) / 2;
        
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(coverX, coverY, coverWidth, coverHeight);

        if (flipProgress < 1) {
          requestAnimationFrame(flip);
        } else {
          setShowRules(true);
        }
      };
      flip();
    };

    animateMoveRight();
  };

  return (
    <div className="cover-container" onClick={handleFlip}>
      <canvas ref={canvasRef} className="cover-canvas" />
      {showRules && (
        <div className="rules fade-in">
          <p>1. 今日あった出来事を感情の赴くままに綴ってください</p>
          <p>2. 個人情報の記載は禁止とします</p>
          <p>3. 最後の一文は「明日はきっと、もっといい一日になる」とします。</p>
        </div>
      )}
    </div>
  );
};

export default CoverPage;
