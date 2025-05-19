import HTMLFlipBook from 'react-pageflip';

export const FlipBookTest = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <HTMLFlipBook 
  width={400}
  height={500}
  minWidth={300}
  maxWidth={1000}
  minHeight={400}
  maxHeight={1536}
  showCover={true}
  mobileScrollSupport={true}
>
  <div className="cover bg-[ivory] text-center flex items-center justify-center font-bold text-lg" data-density="hard">
    traveling-note
  </div>
  <div className="page bg-white border border-black p-4">Page 1</div>
  <div className="page bg-white border border-black p-4">Page 2</div>
  <div className="page bg-white border border-black p-4">Page 3</div>
  <div className="page bg-white border border-black p-4" data-density="hard">
    THE END
  </div>
</HTMLFlipBook>

    </div>
  );
};
