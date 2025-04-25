// Canvas を使ってページを描画・操作するためのクラス
// PageFlip のレンダリング処理を担う抽象クラス Render を継承して、具体的な描画処理を定義している

import { Orientation, Render } from './Render.ts';
import { PageFlip } from '../PageFlip.ts';
import { FlipDirection } from '../Flip/Flip.ts';
import { PageOrientation } from '../Page/Page.ts';
import { FlipSetting } from '../Settings.ts';

export class CanvasRender extends Render {
    private readonly canvas: HTMLCanvasElement;                // 描画に使う <canvas> 要素
    private readonly ctx: CanvasRenderingContext2D;            // 2D コンテキスト

    constructor(app: PageFlip, setting: FlipSetting, inCanvas: HTMLCanvasElement) {
        super(app, setting);

        this.canvas = inCanvas;
        const ctx = inCanvas.getContext('2d');                 // 2D コンテキストを取得
        if (!ctx) {
            throw new Error("2D context が取得できませんでした。Canvas が正しく初期化されているか確認してください。");
        }
        this.ctx = ctx;
    }

    // 描画に使うコンテキストを取得
    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    // 再描画要求時に呼ばれるが、ここでは未実装（任意で定義可能）
    public reload(): void {
        // optional implementation
    }

    // 毎フレーム呼ばれて描画処理を行う
    protected drawFrame(): void {
        this.clear();  // キャンバス全体をクリア

        // 左ページの描画（横向き時のみ）
        if (this.orientation !== Orientation.PORTRAIT)
            if (this.leftPage != null) this.leftPage.simpleDraw(PageOrientation.LEFT);

        // 右ページの描画
        if (this.rightPage != null) this.rightPage.simpleDraw(PageOrientation.RIGHT);

        // 下に見えているページの描画（フリップ中の影になる）
        if (this.bottomPage != null) this.bottomPage.draw();

        this.drawBookShadow();  // 本の中央の影を描画

        // フリップ中のページの描画
        if (this.flippingPage != null) this.flippingPage.draw();

        // フリップ中の影（ページの外側・内側）を描画
        if (this.shadow != null) {
            this.drawOuterShadow();
            this.drawInnerShadow();
        }

        // 縦表示時の右ページクリッピング（ページが重なって見えないように）
        const rect = this.getRect();
        if (this.orientation === Orientation.PORTRAIT) {
            this.ctx.beginPath();
            this.ctx.rect(rect.left + rect.pageWidth, rect.top, rect.width, rect.height);
            this.ctx.clip();
        }
    }

    // 中央の「本の背」のような影を描画する処理
    private drawBookShadow(): void {
        const rect = this.getRect();

        this.ctx.save();
        this.ctx.beginPath();

        const shadowSize = rect.width / 20;
        this.ctx.rect(rect.left, rect.top, rect.width, rect.height);

        const shadowPos = { x: rect.left + rect.width / 2 - shadowSize / 2, y: 0 };
        this.ctx.translate(shadowPos.x, shadowPos.y);

        // 線対称なグラデーションを中央に描画（背表紙のような見た目）
        const outerGradient = this.ctx.createLinearGradient(0, 0, shadowSize, 0);
        outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        outerGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)');
        outerGradient.addColorStop(0.49, 'rgba(255, 255, 255, 0.3)');
        outerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
        outerGradient.addColorStop(0.51, 'rgba(255, 255, 255, 0.3)');
        outerGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
        outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.clip();
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(0, 0, shadowSize, rect.height * 2);
        this.ctx.restore();
    }

    // ページの外側に落ちる影を描画
    private drawOuterShadow(): void {
        if (!this.shadow) return;
        const rect = this.getRect();

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(rect.left, rect.top, rect.width, rect.height);

        const shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
        if (!shadowPos) return;

        this.ctx.translate(shadowPos.x, shadowPos.y);
        this.ctx.rotate(Math.PI + this.shadow.angle + Math.PI / 2);

        const outerGradient = this.ctx.createLinearGradient(0, 0, this.shadow.width, 0);

        if (this.shadow.direction === FlipDirection.FORWARD) {
            this.ctx.translate(0, -100);
            outerGradient.addColorStop(0, `rgba(0, 0, 0, ${this.shadow.opacity})`);
            outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
            this.ctx.translate(-this.shadow.width, -100);
            outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            outerGradient.addColorStop(1, `rgba(0, 0, 0, ${this.shadow.opacity})`);
        }

        this.ctx.clip();
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(0, 0, this.shadow.width, rect.height * 2);
        this.ctx.restore();
    }

    // ページの内側に落ちる影を描画
    private drawInnerShadow(): void {
        if (!this.shadow || !this.pageRect) return;
        const rect = this.getRect();

        this.ctx.save();
        this.ctx.beginPath();

        const shadowPos = this.convertToGlobal({ x: this.shadow.pos.x, y: this.shadow.pos.y });
        if (!shadowPos) return;

        const pageRect = this.convertRectToGlobal(this.pageRect);
        this.ctx.moveTo(pageRect.topLeft.x, pageRect.topLeft.y);
        this.ctx.lineTo(pageRect.topRight.x, pageRect.topRight.y);
        this.ctx.lineTo(pageRect.bottomRight.x, pageRect.bottomRight.y);
        this.ctx.lineTo(pageRect.bottomLeft.x, pageRect.bottomLeft.y);

        this.ctx.translate(shadowPos.x, shadowPos.y);
        this.ctx.rotate(Math.PI + this.shadow.angle + Math.PI / 2);

        const isw = (this.shadow.width * 3) / 4;
        const innerGradient = this.ctx.createLinearGradient(0, 0, isw, 0);

        if (this.shadow.direction === FlipDirection.FORWARD) {
            this.ctx.translate(-isw, -100);
            innerGradient.addColorStop(1, `rgba(0, 0, 0, ${this.shadow.opacity})`);
            innerGradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.3)');
            innerGradient.addColorStop(0.7, `rgba(0, 0, 0, ${this.shadow.opacity})`);
            innerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        } else {
            this.ctx.translate(0, -100);
            innerGradient.addColorStop(0, `rgba(0, 0, 0, ${this.shadow.opacity})`);
            innerGradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.3)');
            innerGradient.addColorStop(0.3, `rgba(0, 0, 0, ${this.shadow.opacity})`);
            innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        this.ctx.clip();
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(0, 0, isw, rect.height * 2);
        this.ctx.restore();
    }

    // キャンバス全体を白で塗りつぶして初期化
    private clear(): void {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
