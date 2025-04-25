// 必要なモジュールのインポート
import { Orientation, Render } from './Render.ts';
import { PageFlip } from '../PageFlip.ts';
import { FlipDirection } from '../Flip/Flip.ts';
import { PageDensity, PageOrientation } from '../Page/Page.ts';
import { HTMLPage } from '../Page/HTMLPage.ts';
import { Helper } from '../Helper.ts';
import { FlipSetting } from '../Settings.ts';
import { Page } from '../Page/Page.ts';

/**
 * HTMLベースのページ描画を行うレンダラークラス（Renderを継承）
 */
export class HTMLRender extends Render {
    private readonly element: HTMLElement;
    private readonly items: NodeListOf<HTMLElement> | HTMLElement[];

    // 影エフェクト要素
    private outerShadow: HTMLElement | null = null;
    private innerShadow: HTMLElement | null = null;
    private hardShadow: HTMLElement | null = null;
    private hardInnerShadow: HTMLElement | null = null;

    constructor(app: PageFlip, setting: FlipSetting, element: HTMLElement) {
        super(app, setting);
        this.element = element;
        this.createShadows(); // 初期化時に影を作成
    }

    /**
     * フリップ時の影となるHTML要素を作成・DOMに追加
     */
    private createShadows(): void {
        this.element.insertAdjacentHTML(
            'beforeend',
            `<div class="stf__outerShadow"></div>
             <div class="stf__innerShadow"></div>
             <div class="stf__hardShadow"></div>
             <div class="stf__hardInnerShadow"></div>`
        );

        // 各影要素の参照を取得
        this.outerShadow = this.element.querySelector('.stf__outerShadow');
        this.innerShadow = this.element.querySelector('.stf__innerShadow');
        this.hardShadow = this.element.querySelector('.stf__hardShadow');
        this.hardInnerShadow = this.element.querySelector('.stf__hardInnerShadow');
    }

    /**
     * すべての影を非表示にする
     */
    public clearShadow(): void {
        super.clearShadow();

        this.outerShadow?.style.setProperty('display', 'none');
        this.innerShadow?.style.setProperty('display', 'none');
        this.hardShadow?.style.setProperty('display', 'none');
        this.hardInnerShadow?.style.setProperty('display', 'none');

        const existing = this.element.querySelector('.stf__centerShadow');
        if (existing) existing.remove(); // 中央影があれば削除
    }

    /**
     * 必要に応じて影を再生成する
     */
    public reload(): void {
        const testShadow = this.element.querySelector('.stf__outerShadow');
        if (!testShadow) this.createShadows();
    }

    /**
     * フリップ中の描画フレームを一括更新
     */
    protected drawFrame(): void {
        this.clear();             // すべて非表示にして初期化
        this.drawLeftPage();      // 左ページ描画
        this.drawRightPage();     // 右ページ描画
        this.drawBottomPage();    // 下ページ描画

        if (this.flippingPage) {
            (this.flippingPage as HTMLPage).getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString();
            this.flippingPage.draw(); // フリップ中のページを描画
        }

        // 中央影の描画処理は削除された模様
    }

    /**
     * 左ページを描画
     */
    private drawLeftPage(): void {
        if (this.orientation === Orientation.PORTRAIT || !this.leftPage) return;

        // ハードページとして描画が必要な場合
        if (this.direction === FlipDirection.BACK && this.flippingPage && this.flippingPage.getDrawingDensity() === PageDensity.HARD) {
            (this.leftPage as HTMLPage).getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString();
            this.leftPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
            this.leftPage.draw(this.flippingPage.getDrawingDensity());
        } else {
            this.leftPage.simpleDraw(PageOrientation.LEFT); // 通常描画
        }
    }

    /**
     * 右ページを描画
     */
    private drawRightPage(): void {
        if (!this.rightPage) return;

        if (this.direction === FlipDirection.FORWARD && this.flippingPage && this.flippingPage.getDrawingDensity() === PageDensity.HARD) {
            (this.rightPage as HTMLPage).getElement().style.zIndex = (this.getSettings().startZIndex + 5).toString();
            this.rightPage.setHardDrawingAngle(180 + this.flippingPage.getHardAngle());
            this.rightPage.draw(this.flippingPage.getDrawingDensity());
        } else {
            this.rightPage.simpleDraw(PageOrientation.RIGHT);
        }
    }

    /**
     * 下に隠れているページを描画（現在のアニメーションに応じて）
     */
    private drawBottomPage(): void {
        if (!this.bottomPage) return;
    
        const tempDensity = this.flippingPage?.getDrawingDensity() ?? undefined;
    
        if (!(this.orientation === Orientation.PORTRAIT && this.direction === FlipDirection.BACK)) {
            const element = (this.bottomPage as HTMLPage).getElement();
            element.style.zIndex = (this.getSettings().startZIndex + 2).toString(); // Z-index を少し下に設定
            element.style.display = 'block'; // 表示
            this.bottomPage.draw(tempDensity);
        }
    }

    /**
     * すべてのページ要素を一旦非表示にする（再描画用）
     */
    private clear(): void {
        for (const page of this.app.getPageCollection().getPages()) {
            if (page !== this.leftPage && page !== this.rightPage && page !== this.flippingPage && page !== this.bottomPage) {
                (page as HTMLPage).getElement().style.cssText = 'display: none';
            }

            if (page.getTemporaryCopy() !== this.flippingPage) {
                page.hideTemporaryCopy(); // 一時コピーがある場合は削除
            }

            if (page === this.bottomPage) {
                (page as HTMLPage).getElement().style.display = 'block';
            } else {
                (page as HTMLPage).getElement().style.cssText = 'display: none';
            }
        }
    }

    /**
     * 描画の更新処理。ページの左右の配置をセット
     */
    public update(): void {
        super.update();

        if (this.rightPage) {
            this.rightPage.setOrientation(PageOrientation.RIGHT);
        }

        if (this.leftPage) {
            this.leftPage.setOrientation(PageOrientation.LEFT);
        }
    }

    /**
     * 左ページをセット
     */
    public setLeftPage(page: Page | null): void {
        this.leftPage = page;
        if (this.leftPage) {
            this.leftPage.setOrientation(PageOrientation.LEFT);
        }
    }

    /**
     * 右ページをセット
     */
    public setRightPage(page: Page | null): void {
        this.rightPage = page;
        if (this.rightPage) {
            this.rightPage.setOrientation(PageOrientation.RIGHT);
        }
    }
}
