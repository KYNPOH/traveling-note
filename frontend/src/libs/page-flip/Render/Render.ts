// 必要なクラスや型をインポート
import { PageFlip } from '../PageFlip.ts';
import { Point, PageRect, RectPoints } from '../BasicTypes.ts';
import { FlipDirection } from '../Flip/Flip.ts';
import { Page, PageOrientation } from '../Page/Page.ts';
import { FlipSetting, SizeType } from '../Settings.ts';

// アニメーションフレームの型（関数）
type FrameAction = () => void;
// アニメーション成功時のコールバック型
type AnimationSuccessAction = () => void;

// 影の状態を定義する型
type Shadow = {
    pos: Point;               // 影の始点
    angle: number;            // 影の角度
    width: number;            // 幅
    opacity: number;          // 不透明度
    direction: FlipDirection; // フリップ方向
    progress: number;         // 進行度（0〜100）
};

// アニメーションの状態を表す型
type AnimationProcess = {
    frames: FrameAction[];             // アニメーションフレーム群
    duration: number;                  // 全体の時間
    durationFrame: number;             // 各フレームの持続時間
    onAnimateEnd: AnimationSuccessAction; // 完了時コールバック
    startedAt: number;                 // アニメーション開始時間
};

// 書籍の向きを定義
export const enum Orientation {
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape',
}

// 書籍を描画するための抽象クラス
export abstract class Render {
    protected readonly setting: FlipSetting;
    protected readonly app: PageFlip;

    // 現在表示されている左右ページ
    protected leftPage: Page | null = null;
    protected rightPage: Page | null = null;

    // 現在フリップ中のページ
    protected flippingPage: Page | null = null;
    protected bottomPage: Page | null = null;

    protected direction: FlipDirection | null = null; // 現在のフリップ方向
    protected orientation: Orientation | null = null; // 現在の書籍の向き

    protected shadow: Shadow | null = null;           // 影の状態
    protected animation: AnimationProcess | null = null; // アニメーション情報
    protected pageRect: RectPoints | null = null;     // ページの座標情報
    private boundsRect: PageRect | null = null;       // 書籍全体のサイズ情報

    protected timer = 0; // 描画に使われるタイマー

    private safari = false; // Safari 判定（clip-path 対応用）

    // コンストラクタ
    protected constructor(app: PageFlip, setting: FlipSetting) {
        this.setting = setting;
        this.app = app;

        // Safari判定（clip-pathに関するバグ回避）
        const regex = new RegExp('Version\\/[\\d\\.]+.*Safari/');
        this.safari = regex.exec(window.navigator.userAgent) !== null;
    }

    // 実際の描画処理（サブクラスでオーバーライド）
    protected abstract drawFrame(): void;

    // 描画エリアを再読み込み（ページ更新後など）
    public abstract reload(): void;

    // 描画ループ内で呼ばれる。アニメーションの進行を制御。
    private render(timer: number): void {
        if (this.animation !== null) {
            const frameIndex = Math.round(
                (timer - this.animation.startedAt) / this.animation.durationFrame
            );

            if (frameIndex < this.animation.frames.length) {
                this.animation.frames[frameIndex]();
            } else {
                this.animation.onAnimateEnd();
                this.animation = null;
            }
        }

        this.timer = timer;
        this.drawFrame();
    }

    // requestAnimationFrame により描画処理を継続実行
    public start(): void {
        this.update();

        const loop = (timer: number): void => {
            this.render(timer);
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    // アニメーションを開始する
    public startAnimation(
        frames: FrameAction[],
        duration: number,
        onAnimateEnd: AnimationSuccessAction
    ): void {
        this.finishAnimation();

        this.animation = {
            frames,
            duration,
            durationFrame: duration / frames.length,
            onAnimateEnd,
            startedAt: this.timer,
        };
    }

    // 現在のアニメーションを終了
    public finishAnimation(): void {
        if (this.animation !== null) {
            this.animation.frames[this.animation.frames.length - 1]();
            if (this.animation.onAnimateEnd !== null) {
                this.animation.onAnimateEnd();
            }
        }

        this.animation = null;
    }

    // サイズと向きを再計算
    public update(): void {
        this.boundsRect = null;
        const orientation = this.calculateBoundsRect();

        if (this.orientation !== orientation) {
            this.orientation = orientation;
            this.app.updateOrientation(orientation);
        }
    }

    // 書籍サイズ・向きを算出
    private calculateBoundsRect(): Orientation {
        let orientation = Orientation.LANDSCAPE;
        const blockWidth = this.getBlockWidth();
        const middlePoint: Point = {
            x: blockWidth / 2,
            y: this.getBlockHeight() / 2,
        };

        const ratio = this.setting.width / this.setting.height;
        let pageWidth = this.setting.width;
        let pageHeight = this.setting.height;

        let left = middlePoint.x - pageWidth;

        if (this.setting.size === SizeType.STRETCH) {
            if (blockWidth < this.setting.minWidth * 2 && this.app.getSettings().usePortrait)
                orientation = Orientation.PORTRAIT;

            pageWidth =
                orientation === Orientation.PORTRAIT
                    ? this.getBlockWidth()
                    : this.getBlockWidth() / 2;

            if (pageWidth > this.setting.maxWidth) pageWidth = this.setting.maxWidth;

            pageHeight = pageWidth / ratio;
            if (pageHeight > this.getBlockHeight()) {
                pageHeight = this.getBlockHeight();
                pageWidth = pageHeight * ratio;
            }

            left =
                orientation === Orientation.PORTRAIT
                    ? middlePoint.x - pageWidth / 2 - pageWidth
                    : middlePoint.x - pageWidth;
        } else {
            if (blockWidth < pageWidth * 2 && this.app.getSettings().usePortrait) {
                orientation = Orientation.PORTRAIT;
                left = middlePoint.x - pageWidth / 2 - pageWidth;
            }
        }

        this.boundsRect = {
            left,
            top: middlePoint.y - pageHeight / 2,
            width: pageWidth * 2,
            height: pageHeight,
            pageWidth,
        };

        return orientation;
    }

    // 影のパラメータを設定
    public setShadowData(
        pos: Point,
        angle: number,
        progress: number,
        direction: FlipDirection
    ): void {
        if (!this.app.getSettings().drawShadow) return;

        const maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;

        this.shadow = {
            pos,
            angle,
            width: (((this.getRect().pageWidth * 3) / 4) * progress) / 100,
            opacity: ((100 - progress) * maxShadowOpacity) / 100 / 100,
            direction,
            progress: progress * 2,
        };
    }

    // 影を消去
    public clearShadow(): void {
        this.shadow = null;
    }

    // 親要素のサイズ取得
    public getBlockWidth(): number {
        return this.app.getUI().getDistElement().offsetWidth;
    }

    public getBlockHeight(): number {
        return this.app.getUI().getDistElement().offsetHeight;
    }

    // 現在のフリップ方向を返す
    public getDirection(): FlipDirection {
        if (this.direction === null) throw new Error("Direction is not set");
        return this.direction;
    }

    // 表示領域の取得
    public getRect(): PageRect {
        if (this.boundsRect === null) this.calculateBoundsRect();
        return this.boundsRect!;
    }

    public getSettings(): FlipSetting {
        return this.app.getSettings();
    }

    public getOrientation(): Orientation {
        return this.orientation!;
    }

    public setPageRect(pageRect: RectPoints): void {
        this.pageRect = pageRect;
    }

    public setDirection(direction: FlipDirection): void {
        this.direction = direction;
    }

    public setRightPage(page: Page): void {
        if (page !== null) page.setOrientation(PageOrientation.RIGHT);
        this.rightPage = page;
    }

    public setLeftPage(page: Page): void {
        if (page !== null) page.setOrientation(PageOrientation.LEFT);
        this.leftPage = page;
    }

    public setBottomPage(page: Page): void {
        if (page !== null)
            page.setOrientation(
                this.direction === FlipDirection.BACK
                    ? PageOrientation.LEFT
                    : PageOrientation.RIGHT
            );
        this.bottomPage = page;
    }

    public setFlippingPage(page: Page): void {
        if (page !== null)
            page.setOrientation(
                this.direction === FlipDirection.FORWARD && this.orientation !== Orientation.PORTRAIT
                    ? PageOrientation.LEFT
                    : PageOrientation.RIGHT
            );
        this.flippingPage = page;
    }

    // グローバル座標 → 書籍内座標
    public convertToBook(pos: Point): Point {
        const rect = this.getRect();
        return { x: pos.x - rect.left, y: pos.y - rect.top };
    }

    // Safari 用判定
    public isSafari(): boolean {
        return this.safari;
    }

    // グローバル座標 → ページ座標
    public convertToPage(pos: Point, direction?: FlipDirection): Point {
        if (!direction && this.direction !== null) direction = this.direction;
        const rect = this.getRect();

        const x =
            direction === FlipDirection.FORWARD
                ? pos.x - rect.left - rect.width / 2
                : rect.width / 2 - pos.x + rect.left;

        return { x, y: pos.y - rect.top };
    }

    // ページ座標 → グローバル座標
    public convertToGlobal(pos: Point, direction?: FlipDirection): Point | null {
        if (!direction && this.direction !== null) direction = this.direction;
        if (pos == null) return null;

        const rect = this.getRect();

        const x =
            direction === FlipDirection.FORWARD
                ? pos.x + rect.left + rect.width / 2
                : rect.width / 2 - pos.x + rect.left;

        return { x, y: pos.y + rect.top };
    }

    // 四隅の矩形座標 → グローバル座標へ変換
    public convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints {
        if (!direction && this.direction !== null) direction = this.direction;

        const topLeft = this.convertToGlobal(rect.topLeft, direction);
        const topRight = this.convertToGlobal(rect.topRight, direction);
        const bottomLeft = this.convertToGlobal(rect.bottomLeft, direction);
        const bottomRight = this.convertToGlobal(rect.bottomRight, direction);

        if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
            throw new Error('convertToGlobal returned null for one or more points');
        }

        return { topLeft, topRight, bottomLeft, bottomRight };
    }
}
