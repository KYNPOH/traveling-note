import { Page, PageDensity, PageOrientation } from './Page.ts';
import { Render } from '../Render/Render.ts';
import { Helper } from '../Helper.ts';
import { FlipDirection } from '../Flip/Flip.ts';
import { Point } from '../BasicTypes.ts';

/**
 * Class representing a book page as a HTML Element
 */
/**
 * HTML 要素として表現されたページクラス
 */
export class HTMLPage extends Page {
    // 実際のページ DOM 要素
    private readonly element: HTMLElement;
    // 複製された要素（テンポラリ用）
    private copiedElement: HTMLElement | null = null;
    // 一時的なページコピー
    private temporaryCopy: Page | null = null;
    // 読み込み状態のフラグ
    private isLoad = false;

    constructor(render: Render, element: HTMLElement, density: PageDensity) {
        super(render, density);

        this.element = element;
        this.element.classList.add('stf__item'); // スタイル適用用クラス
        this.element.classList.add('--' + density); // ソフト／ハード密度クラス
    }

    /**
     * ハードページ以外の場合、一時的なページのコピーを作成・返却
     */
    public newTemporaryCopy(): Page {
        if (this.nowDrawingDensity === PageDensity.HARD) {
            return this;
        }

        if (this.temporaryCopy === null) {
            this.copiedElement = this.element.cloneNode(true) as HTMLElement;
            this.element.parentElement?.appendChild(this.copiedElement);

            this.temporaryCopy = new HTMLPage(
                this.render,
                this.copiedElement,
                this.nowDrawingDensity
            );
        }

        return this.getTemporaryCopy();
    }

    /**
     * 一時的なコピーを取得（なければ自身を返す）
     */
    public getTemporaryCopy(): Page {
        return this.temporaryCopy ?? this;
    }

    /**
     * 一時的なコピーを削除
     */
    public hideTemporaryCopy(): void {
        if (this.temporaryCopy !== null && this.copiedElement !== null) {
            this.copiedElement.remove();
            this.copiedElement = null;
            this.temporaryCopy = null;
        }
    }

    /**
     * ページ描画（ソフト／ハード密度に応じて描画方式を分岐）
     */
    public draw(tempDensity?: PageDensity): void {
        const density = tempDensity ?? this.nowDrawingDensity;

        const pagePos = this.render.convertToGlobal(this.state.position);
        if (!pagePos) return;

        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;

        this.element.classList.remove('--simple');

        const commonStyle = `
            display: block;
            z-index: ${this.element.style.zIndex};
            left: 0;
            top: 0;
            width: ${pageWidth}px;
            height: ${pageHeight}px;
        `;

        density === PageDensity.HARD
            ? this.drawHard(commonStyle)
            : this.drawSoft(pagePos, commonStyle);
    }

    /**
     * ハードページの描画スタイルを設定
     */
    private drawHard(commonStyle = ''): void {
        const pos = this.render.getRect().left + this.render.getRect().width / 2;
        const angle = this.state.hardDrawingAngle;

        const newStyle =
            commonStyle +
            `
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                clip-path: none;
                -webkit-clip-path: none;
            ` +
            (this.orientation === PageOrientation.LEFT
                ? `transform-origin: ${this.render.getRect().pageWidth}px 0; 
                   transform: translate3d(0, 0, 0) rotateY(${angle}deg);`
                : `transform-origin: 0 0; 
                   transform: translate3d(${pos}px, 0, 0) rotateY(${angle}deg);`);

        this.element.style.cssText = newStyle;
    }

    /**
     * ソフトページの描画スタイルを設定（clip-path を用いて多角形マスクを設定）
     */
    private drawSoft(position: Point, commonStyle = ''): void {
        let polygon = 'polygon( ';
        for (const p of this.state.area) {
            if (p) {
                let g = this.render.getDirection() === FlipDirection.BACK
                    ? { x: -p.x + this.state.position.x, y: p.y - this.state.position.y }
                    : { x: p.x - this.state.position.x, y: p.y - this.state.position.y };

                g = Helper.getRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
                polygon += `${g.x}px ${g.y}px, `;
            }
        }
        polygon = polygon.slice(0, -2) + ')';

        const newStyle =
            commonStyle +
            `transform-origin: 0 0; clip-path: ${polygon}; -webkit-clip-path: ${polygon};` +
            (this.render.isSafari() && this.state.angle === 0
                ? `transform: translate(${position.x}px, ${position.y}px);`
                : `transform: translate3d(${position.x}px, ${position.y}px, 0) rotate(${this.state.angle}rad);`);

        this.element.style.cssText = newStyle;
    }

    /**
     * シンプルな表示（固定角・位置）の描画
     */
    public simpleDraw(orient: PageOrientation): void {
        const rect = this.render.getRect();
        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;
        const x = orient === PageOrientation.RIGHT ? rect.left + pageWidth : rect.left;
        const y = rect.top;

        this.element.classList.add('--simple');
        this.element.style.cssText = `
            position: absolute;
            display: block;
            height: ${pageHeight}px;
            left: ${x}px;
            top: ${y}px;
            width: ${pageWidth}px;
            z-index: ${this.render.getSettings().startZIndex + 1};`;
    }

    /**
     * ページ要素の取得
     */
    public getElement(): HTMLElement {
        return this.element;
    }

    /**
     * 読み込み完了フラグを立てる
     */
    public load(): void {
        this.isLoad = true;
    }

    /**
     * 表示位置（左／右ページ）の設定
     */
    public setOrientation(orientation: PageOrientation): void {
        super.setOrientation(orientation);
        this.element.classList.remove('--left', '--right');
        this.element.classList.add(orientation === PageOrientation.RIGHT ? '--right' : '--left');
    }

    /**
     * 描画密度（ハード／ソフト）の変更とクラス適用
     */
    public setDrawingDensity(density: PageDensity): void {
        this.element.classList.remove('--soft', '--hard');
        this.element.classList.add('--' + density);
        super.setDrawingDensity(density);
    }
}
