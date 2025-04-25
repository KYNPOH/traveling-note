// 必要なクラスと型をインポート
import { CanvasRender } from '../Render/CanvasRender.ts';        // Canvas 描画専用レンダラ
import { Page, PageDensity, PageOrientation } from './Page.ts';  // ページ共通クラス・設定
import { Render } from '../Render/Render.ts';                    // レンダリング基底クラス
import { Point } from '../BasicTypes.ts';                        // 座標型

/**
 * 画像を Canvas 上に表示するページクラス
 */
export class ImagePage extends Page {
    /** ページ表示に使う画像要素 */
    private readonly image: HTMLImageElement;
    
    /** 画像の読み込み完了フラグ */
    private isLoad = false;

    /** ローディングスピナーの回転角度 */
    private loadingAngle = 0;

    /**
     * コンストラクタ
     * @param render - レンダラー（CanvasRenderを想定）
     * @param href - 画像のURL
     * @param density - ページの密度（SOFT / HARD）
     */
    constructor(render: Render, href: string, density: PageDensity) {
        super(render, density);            // 基底 Page クラスの初期化
        this.image = new Image();          // HTMLImageElement を生成
        this.image.src = href;             // 表示対象の画像パスを指定
    }

    /**
     * 通常の動的描画（アニメーション中や折れ曲がった状態）
     * @param tempDensity - 一時的な描画密度（指定があれば）
     */
    public draw(tempDensity?: PageDensity): void {
        const ctx = (this.render as CanvasRender).getContext();  // Canvas描画コンテキストを取得
        const pagePos = this.render.convertToGlobal(this.state.position); // ページの表示位置を取得
        if (!pagePos) return;

        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;

        ctx.save();                         // 現在のCanvas状態を保存
        ctx.translate(pagePos.x, pagePos.y); // ページ表示位置に移動
        ctx.beginPath();                    // 描画パスの開始

        // 描画範囲をクリップするためのパスを設定
        for (let p of this.state.area) {
            if (p) {
                const globalP = this.render.convertToGlobal(p);
                if (!globalP) continue;
                ctx.lineTo(globalP.x - pagePos.x, globalP.y - pagePos.y);
            }
        }

        ctx.rotate(this.state.angle);      // ページの回転を適用
        ctx.clip();                        // クリッピングを実行

        // 読み込みが完了していない場合はローディング表示
        if (!this.isLoad) {
            this.drawLoader(ctx, { x: 0, y: 0 }, pageWidth, pageHeight);
        } else {
            ctx.drawImage(this.image, 0, 0, pageWidth, pageHeight); // 画像を描画
        }

        ctx.restore(); // 保存した状態に戻す
    }

    /**
     * シンプルな静止描画（通常の見開き表示）
     * @param orient - 左ページか右ページか
     */
    public simpleDraw(orient: PageOrientation): void {
        const rect = this.render.getRect();
        const ctx = (this.render as CanvasRender).getContext();
        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;

        const x = orient === PageOrientation.RIGHT ? rect.left + pageWidth : rect.left;
        const y = rect.top;

        if (!this.isLoad) {
            this.drawLoader(ctx, { x, y }, pageWidth, pageHeight);
        } else {
            ctx.drawImage(this.image, x, y, pageWidth, pageHeight);
        }
    }

    /**
     * 読み込み中のローディングスピナーを描画する
     * @param ctx - Canvasの描画コンテキスト
     * @param shiftPos - 描画開始位置
     * @param pageWidth - ページ幅
     * @param pageHeight - ページ高さ
     */
    private drawLoader(
        ctx: CanvasRenderingContext2D,
        shiftPos: Point,
        pageWidth: number,
        pageHeight: number
    ): void {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(200, 200, 200)'; // 薄いグレーの枠
        ctx.fillStyle = 'rgb(255, 255, 255)';   // 白背景
        ctx.lineWidth = 1;
        ctx.rect(shiftPos.x + 1, shiftPos.y + 1, pageWidth - 1, pageHeight - 1);
        ctx.stroke();
        ctx.fill();

        const middlePoint: Point = {
            x: shiftPos.x + pageWidth / 2,
            y: shiftPos.y + pageHeight / 2,
        };

        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.arc(
            middlePoint.x,
            middlePoint.y,
            20,
            this.loadingAngle,
            (3 * Math.PI) / 2 + this.loadingAngle
        );
        ctx.stroke();
        ctx.closePath();

        // アニメーションのための角度更新
        this.loadingAngle += 0.07;
        if (this.loadingAngle >= 2 * Math.PI) {
            this.loadingAngle = 0;
        }
    }

    /**
     * ページの画像を読み込む（非同期でonloadを監視）
     */
    public load(): void {
        if (!this.isLoad) {
            this.image.onload = () => {
                this.isLoad = true;
            };
        }
    }

    /**
     * 一時的なコピー（ImagePageではそのまま自身を返す）
     */
    public newTemporaryCopy(): Page {
        return this;
    }

    public getTemporaryCopy(): Page {
        return this;
    }

    public hideTemporaryCopy(): void {
        // HTMLPage では cloneNode を使うが、ImagePage では不要（no-op）
    }
}
