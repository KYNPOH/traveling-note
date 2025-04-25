// 必要なクラスや型のインポート
import { PageFlip } from '../PageFlip.ts';
import { Point } from '../BasicTypes.ts';
import { FlipSetting, SizeType } from '../Settings.ts';
import { FlipCorner, FlippingState } from '../Flip/Flip.ts';
import { Orientation } from '../Render/Render.ts';

// スワイプ開始時の位置と時刻を記録するためのデータ型
export type SwipeData = {
    point: Point;
    time: number;
};

/**
 * 📱 UIのベースクラス（CanvasUI / HTMLUI の親）
 * - DOMとの連携処理、レスポンシブ対応、マウス・タッチ操作をまとめて管理
 */
export abstract class UI {
    // ページ全体を内包する親要素
    protected readonly parentElement: HTMLElement;
    // PageFlip 本体インスタンス
    protected readonly app: PageFlip;
    // .stf__wrapper 要素（UIの内側ラッパー）
    protected readonly wrapper: HTMLElement;
    // ページ要素が追加される描画対象の要素（canvas または div）
    protected distElement!: HTMLElement;

    // タッチスワイプ開始点と時刻
    private touchPoint: SwipeData | null = null;
    // スワイプとして認識される最大時間
    private readonly swipeTimeout = 250;
    // スワイプと認識される最小移動距離
    private readonly swipeDistance: number;

    // リサイズ時の処理（update 呼び出し）
    private readonly onResize = (): void => {
        this.update();
    };

    /**
     * コンストラクタ：UIの初期化と基本DOM構築を行う
     */
    protected constructor(inBlock: HTMLElement, app: PageFlip, setting: FlipSetting) {
        this.parentElement = inBlock;
        this.app = app;

        // スタイル設定とクラス追加
        inBlock.classList.add('stf__parent');
        inBlock.insertAdjacentHTML('afterbegin', '<div class="stf__wrapper"></div>');

        // wrapper 要素の取得
        const wrapper = inBlock.querySelector('.stf__wrapper') as HTMLElement;
        if (!wrapper) throw new Error("'.stf__wrapper' element not found");
        this.wrapper = wrapper;

        // サイズに応じた最小幅・高さを設定
        const k = setting.usePortrait ? 1 : 2;

        inBlock.style.minWidth = setting.minWidth * k + 'px';
        inBlock.style.minHeight = setting.minHeight + 'px';

        if (setting.size === SizeType.FIXED) {
            inBlock.style.minWidth = setting.width * k + 'px';
            inBlock.style.minHeight = setting.height + 'px';
        }

        // 自動サイズ調整対応
        if (setting.autoSize) {
            inBlock.style.width = '100%';
            inBlock.style.maxWidth = setting.maxWidth * 2 + 'px';
        }

        inBlock.style.display = 'block';

        // ウィンドウサイズ変更時の処理を登録
        window.addEventListener('resize', this.onResize, false);
        this.swipeDistance = setting.swipeDistance;
    }

    /**
     * UIの破棄処理（要素削除とイベント解除）
     */
    public destroy(): void {
        if (this.app.getSettings().useMouseEvents) this.removeHandlers();

        this.distElement.remove();
        this.wrapper.remove();
    }

    /**
     * UIの再描画やサイズ更新などを行う（派生クラスで実装）
     */
    public abstract update(): void;

    /**
     * 描画対象の要素を取得
     */
    public getDistElement(): HTMLElement {
        return this.distElement;
    }

    /**
     * ラッパー要素を取得
     */
    public getWrapper(): HTMLElement {
        return this.wrapper;
    }

    /**
     * 現在の表示モードに応じたスタイルを wrapper に反映
     */
    public setOrientationStyle(orientation: Orientation): void {
        this.wrapper.classList.remove('--portrait', '--landscape');

        if (orientation === Orientation.PORTRAIT) {
            if (this.app.getSettings().autoSize)
                this.wrapper.style.paddingBottom =
                    (this.app.getSettings().height / this.app.getSettings().width) * 100 + '%';

            this.wrapper.classList.add('--portrait');
        } else {
            if (this.app.getSettings().autoSize)
                this.wrapper.style.paddingBottom =
                    (this.app.getSettings().height / (this.app.getSettings().width * 2)) * 100 + '%';

            this.wrapper.classList.add('--landscape');
        }

        this.update();
    }

    /**
     * イベントハンドラを解除（マウスやタッチ）
     */
    protected removeHandlers(): void {
        window.removeEventListener('resize', this.onResize);

        this.distElement.removeEventListener('mousedown', this.onMouseDown);
        this.distElement.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    /**
     * イベントハンドラを登録（マウスやタッチ）
     */
    protected setHandlers(): void {
        window.addEventListener('resize', this.onResize, false);
        if (!this.app.getSettings().useMouseEvents) return;

        this.distElement.addEventListener('mousedown', this.onMouseDown);
        this.distElement.addEventListener('touchstart', this.onTouchStart);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('touchmove', this.onTouchMove, {
            passive: !this.app.getSettings().mobileScrollSupport,
        });
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('touchend', this.onTouchEnd);
    }

    /**
     * 座標を描画対象要素（canvas等）に対して相対的な位置に変換
     */
    private getMousePos(x: number, y: number): Point {
        const rect = this.distElement.getBoundingClientRect();

        return {
            x: x - rect.left,
            y: y - rect.top,
        };
    }

    /**
     * イベント発火対象が許可されている要素かどうかを判定（リンクやボタンは除外）
     */
    private checkTarget(target: EventTarget | null): boolean {
        if (!this.app.getSettings().clickEventForward) return true;

        if (target && ['a', 'button'].includes((target as HTMLElement).tagName.toLowerCase())) {
            return false;
        }

        return true;
    }

    // マウスダウン処理：操作開始
    private onMouseDown = (e: MouseEvent): void => {
        if (this.checkTarget(e.target)) {
            const pos = this.getMousePos(e.clientX, e.clientY);

            this.app.startUserTouch(pos);

            e.preventDefault();
        }
    };

    // タッチスタート処理：スワイプ判定を準備
    private onTouchStart = (e: TouchEvent): void => {
        if (this.checkTarget(e.target)) {
            if (e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const pos = this.getMousePos(t.clientX, t.clientY);

                this.touchPoint = {
                    point: pos,
                    time: Date.now(),
                };

                // 一定時間後にドラッグ開始処理
                setTimeout(() => {
                    if (this.touchPoint !== null) {
                        this.app.startUserTouch(pos);
                    }
                }, this.swipeTimeout);

                if (!this.app.getSettings().mobileScrollSupport) e.preventDefault();
            }
        }
    };

    // マウスリリース時の処理：ドラッグまたはクリック終了
    private onMouseUp = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userStop(pos);
    };

    // マウス移動時の処理：ページ折り操作の進行
    private onMouseMove = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userMove(pos, false);
    };

    // タッチ移動時の処理：ページ折り操作 or スワイプ検出
    private onTouchMove = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);

            if (this.app.getSettings().mobileScrollSupport) {
                if (this.touchPoint !== null) {
                    if (
                        Math.abs(this.touchPoint.point.x - pos.x) > 10 ||
                        this.app.getState() !== FlippingState.READ
                    ) {
                        if (e.cancelable) this.app.userMove(pos, true);
                    }
                }

                if (this.app.getState() !== FlippingState.READ) {
                    e.preventDefault();
                }
            } else {
                this.app.userMove(pos, true);
            }
        }
    };

    // タッチ終了時の処理：スワイプ動作かどうかを判定してページをめくる
    private onTouchEnd = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);
            let isSwipe = false;

            if (this.touchPoint !== null) {
                const dx = pos.x - this.touchPoint.point.x;
                const distY = Math.abs(pos.y - this.touchPoint.point.y);

                // スワイプと判定する条件
                if (
                    Math.abs(dx) > this.swipeDistance &&
                    distY < this.swipeDistance * 2 &&
                    Date.now() - this.touchPoint.time < this.swipeTimeout
                ) {
                    const render = this.app.getRender();
                    const corner = this.touchPoint.point.y < render.getRect().height / 2
                        ? FlipCorner.TOP
                        : FlipCorner.BOTTOM;

                    if (dx > 0) {
                        this.app.flipPrev(corner);
                    } else {
                        this.app.flipNext(corner);
                    }

                    isSwipe = true;
                }

                this.touchPoint = null;
            }

            this.app.userStop(pos, isSwipe);
        }
    };
}
