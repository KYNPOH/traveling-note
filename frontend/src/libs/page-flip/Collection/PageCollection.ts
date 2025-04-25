// 必要なモジュールをインポート
import { Orientation, Render } from '../Render/Render.ts';         // 向き（縦/横）と描画処理
import { Page, PageDensity } from '../Page/Page.ts';               // ページモデルと密度設定（HARD/SOFT）
import { PageFlip } from '../PageFlip.ts';                         // メインの制御クラス
import { FlipDirection } from '../Flip/Flip.ts';                   // フリップ方向（進む・戻る）

type NumberArray = number[]; // 配列のエイリアス（数値配列）

/**
 * ページコレクション（ベースクラス）
 * - ページの保持・管理、表示する見開き構成を扱う。
 */
export abstract class PageCollection {
    protected readonly app: PageFlip;                      // 親となる PageFlip インスタンス
    protected readonly render: Render;                     // ページを描画するレンダラー
    protected readonly isShowCover: boolean;               // 表紙を特別扱いするかどうかのフラグ

    protected pages: Page[] = [];                          // ページオブジェクトの配列
    protected currentPageIndex = 0;                        // 現在のページ番号
    protected currentSpreadIndex = 0;                      // 現在の見開きインデックス

    protected landscapeSpread: NumberArray[] = [];         // 横表示時の見開き（2ページ）
    protected portraitSpread: NumberArray[] = [];          // 縦表示時の見開き（1ページ）

    // コンストラクタ：基本情報を受け取る
    protected constructor(app: PageFlip, render: Render) {
        this.render = render;
        this.app = app;
        this.currentPageIndex = 0;
        this.isShowCover = this.app.getSettings().showCover;
    }

    // ページ読み込み（サブクラスで具体化）
    public abstract load(): void;

    // コレクション破棄
    public destroy(): void {
        this.pages = [];
    }

    // ページを見開きに分ける
    protected createSpread(): void {
        this.landscapeSpread = [];
        this.portraitSpread = [];

        // 縦表示では 1ページずつ表示
        for (let i = 0; i < this.pages.length; i++) {
            this.portraitSpread.push([i]);
        }

        let start = 0;

        // 表紙表示がオンの場合、最初の1ページをHARDにして単独表示
        if (this.isShowCover) {
            this.pages[0].setDensity(PageDensity.HARD);
            this.landscapeSpread.push([start]);
            start++;
        }

        // それ以降は2ページずつグループ化（横表示用）
        for (let i = start; i < this.pages.length; i += 2) {
            if (i < this.pages.length - 1) {
                this.landscapeSpread.push([i, i + 1]);
            } else {
                this.landscapeSpread.push([i]);
                this.pages[i].setDensity(PageDensity.HARD);
            }
        }
    }

    // 現在の表示モード（縦or横）に応じた spread を取得
    protected getSpread(): NumberArray[] {
        return this.render.getOrientation() === Orientation.LANDSCAPE
            ? this.landscapeSpread
            : this.portraitSpread;
    }

    // ページ番号から見開きのインデックスを取得
    public getSpreadIndexByPage(pageNum: number): number | undefined {
        const spread = this.getSpread();

        for (let i = 0; i < spread.length; i++) {
            if (pageNum === spread[i][0] || pageNum === spread[i][1]) return i;
        }

        return undefined;
    }

    public getPageCount(): number {
        return this.pages.length;
    }

    public getPages(): Page[] {
        return this.pages;
    }

    public getPage(pageIndex: number): Page {
        if (pageIndex >= 0 && pageIndex < this.pages.length) {
            return this.pages[pageIndex];
        }
        throw new Error('Invalid page number');
    }

    // 指定されたページの次ページを取得
    public nextBy(current: Page): Page | null {
        const idx = this.pages.indexOf(current);
        if (idx < this.pages.length - 1) return this.pages[idx + 1];
        return null;
    }

    // 指定されたページの前ページを取得
    public prevBy(current: Page): Page | null {
        const idx = this.pages.indexOf(current);
        if (idx > 0) return this.pages[idx - 1];
        return null;
    }

    // ページフリップ中に使用する仮ページの取得
    public getFlippingPage(direction: FlipDirection): Page {
        const current = this.currentSpreadIndex;

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current]?.newTemporaryCopy()                 // 進む → 仮コピー
                : this.pages[current - 1];                                // 戻る → そのまま
        } else {
            const spread =
                direction === FlipDirection.FORWARD
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];

            if (!spread) throw new Error('Invalid spread');

            return direction === FlipDirection.FORWARD
                ? this.pages[spread[0]]
                : spread.length === 2
                    ? this.pages[spread[1]]
                    : this.pages[spread[0]];
        }
    }

    // フリップ中の下敷きページを取得
    public getBottomPage(direction: FlipDirection): Page {
        const current = this.currentSpreadIndex;

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current + 1]
                : this.pages[current - 1];
        } else {
            const spread =
                direction === FlipDirection.FORWARD
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];

            if (!spread) throw new Error('Invalid spread');

            return direction === FlipDirection.FORWARD
                ? spread.length === 2
                    ? this.pages[spread[1]]
                    : this.pages[spread[0]]
                : this.pages[spread[0]];
        }
    }

    // 次の見開きを表示
    public showNext(): void {
        if (this.currentSpreadIndex < this.getSpread().length - 1) {
            this.currentSpreadIndex++;
            this.showSpread();
        }
    }

    // 前の見開きを表示
    public showPrev(): void {
        if (this.currentSpreadIndex > 0) {
            this.currentSpreadIndex--;
            this.showSpread();
        }
    }

    public getCurrentPageIndex(): number {
        return this.currentPageIndex;
    }

    // 任意のページを表示
    public show(pageNum?: number): void {
        const safePageNum = pageNum ?? this.currentPageIndex;

        if (safePageNum < 0 || safePageNum >= this.pages.length) return;

        const spreadIndex = this.getSpreadIndexByPage(safePageNum);
        if (spreadIndex !== undefined) {
            this.currentSpreadIndex = spreadIndex;
            this.showSpread();
        }
    }

    public getCurrentSpreadIndex(): number {
        return this.currentSpreadIndex;
    }

    public setCurrentSpreadIndex(newIndex: number): void {
        if (newIndex >= 0 && newIndex < this.getSpread().length) {
            this.currentSpreadIndex = newIndex;
        } else {
            throw new Error('Invalid page');
        }
    }

    // 現在の見開きを描画に反映
    private showSpread(): void {
        const spread = this.getSpread()[this.currentSpreadIndex];

        if (!spread) throw new Error('Invalid spread index');

        if (spread.length === 2) {
            this.render.setLeftPage(this.pages[spread[0]]);
            this.render.setRightPage(this.pages[spread[1]]);
        } else {
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                if (spread[0] === this.pages.length - 1) {
                    this.render.setLeftPage(this.pages[spread[0]]);
                    this.render.setRightPage(undefined as unknown as Page);
                } else {
                    this.render.setLeftPage(undefined as unknown as Page);
                    this.render.setRightPage(this.pages[spread[0]]);
                }
            } else {
                this.render.setLeftPage(undefined as unknown as Page);
                this.render.setRightPage(this.pages[spread[0]]);
            }
        }

        this.currentPageIndex = spread[0];
        this.app.updatePageIndex(this.currentPageIndex);
    }
}
