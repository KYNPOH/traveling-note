// 描画に関するモジュールと型定義をインポート
import { Orientation, Render } from '../Render/Render.ts';
import { PageFlip } from '../PageFlip.ts';
import { Helper } from '../Helper.ts';
import { PageRect, Point } from '../BasicTypes.ts';
import { FlipCalculation } from './FlipCalculation.ts';
import { Page, PageDensity } from '../Page/Page.ts';

// ページをめくる方向を示す列挙型
export const enum FlipDirection {
    FORWARD, // 次のページへ
    BACK     // 前のページへ
}

// めくる開始位置（ページの上または下）を定義
export const enum FlipCorner {
    TOP = 'top',
    BOTTOM = 'bottom',
}

// 現在のフリップ状態を示す列挙型
export const enum FlippingState {
    USER_FOLD = 'user_fold',       // ユーザーによる手動の折りたたみ
    FOLD_CORNER = 'fold_corner',   // 角が折れている状態
    FLIPPING = 'flipping',         // アニメーション中
    READ = 'read'                  // 読書状態（待機状態）
}

// Flip クラスはページのフリップ（めくり）処理を制御するクラス
export class Flip {
    private readonly render: Render;        // 描画制御オブジェクト
    private readonly app: PageFlip;         // PageFlip アプリ本体への参照

    private flippingPage: Page | null = null;   // 現在めくっているページ
    private bottomPage: Page | null = null;     // 下に表示するページ（フリップ中に見える）

    private calc: FlipCalculation | null = null; // フリップに必要な座標・角度などを計算するクラス

    private state: FlippingState = FlippingState.READ; // 現在の状態を保持

    constructor(render: Render, app: PageFlip) {
        this.render = render;
        this.app = app;
    }

    // マウスのドラッグによるページ折りの開始処理
    public fold(globalPos: Point): void {
        this.setState(FlippingState.USER_FOLD);
        if (this.calc === null) this.start(globalPos);
        if (this.calc) this.do(this.render.convertToPage(globalPos));
    }

    // フリップアニメーションを開始する
    public flip(globalPos: Point): void {
        // 設定でクリックによるフリップが無効かつ角以外がクリックされた場合は無視
        if (this.app.getSettings().disableFlipByClick && !this.isPointOnCorners(globalPos)) return;

        // アニメーションの途中であれば終了
        if (this.calc !== null) this.render.finishAnimation();
        if (!this.start(globalPos)) return;

        const rect = this.getBoundsRect();
        this.setState(FlippingState.FLIPPING);

        // フリップの開始・終了位置を計算（Y座標）
        const topMargins = rect.height / 10;
        const yStart = this.calc!.getCorner() === FlipCorner.BOTTOM ? rect.height - topMargins : topMargins;
        const yDest = this.calc!.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

        // 初期位置の計算
        this.calc!.calc({ x: rect.pageWidth - topMargins, y: yStart });

        // アニメーション実行
        this.animateFlippingTo(
            { x: rect.pageWidth - topMargins, y: yStart },
            { x: -rect.pageWidth, y: yDest },
            true
        );
    }

    // フリップの初期処理（フリップ対象のページなどを特定）
    public start(globalPos: Point): boolean {
        this.reset();
        const bookPos = this.render.convertToBook(globalPos);
        const rect = this.getBoundsRect();

        const direction = this.getDirectionByPoint(bookPos);
        const flipCorner = bookPos.y >= rect.height / 2 ? FlipCorner.BOTTOM : FlipCorner.TOP;

        if (!this.checkDirection(direction)) return false;

        try {
            const flippingPage = this.app.getPageCollection().getFlippingPage(direction);
            const bottomPage = this.app.getPageCollection().getBottomPage(direction);

            if (!flippingPage || !bottomPage) return false;

            this.flippingPage = flippingPage;
            this.bottomPage = bottomPage;

            // 横向きの場合、左右のページ密度が異なっていれば両方をHARDに変更
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                if (direction === FlipDirection.BACK) {
                    const nextPage = this.app.getPageCollection().nextBy(flippingPage);
                    if (nextPage && flippingPage.getDensity() !== nextPage.getDensity()) {
                        flippingPage.setDrawingDensity(PageDensity.HARD);
                        nextPage.setDrawingDensity(PageDensity.HARD);
                    }
                } else {
                    const prevPage = this.app.getPageCollection().prevBy(flippingPage);
                    if (prevPage && flippingPage.getDensity() !== prevPage.getDensity()) {
                        flippingPage.setDrawingDensity(PageDensity.HARD);
                        prevPage.setDrawingDensity(PageDensity.HARD);
                    }
                }
            }

            this.render.setDirection(direction);
            this.calc = new FlipCalculation(
                direction,
                flipCorner,
                rect.pageWidth.toString(10),
                rect.height.toString(10)
            );

            return true;
        } catch (e) {
            return false;
        }
    }

    // フリップの実際の描画処理（角度・位置・影などを反映）
    private do(pagePos: Point): void {
        if (!this.calc || !this.flippingPage || !this.bottomPage) return;

        if (this.calc.calc(pagePos)) {
            const progress = this.calc.getFlippingProgress();

            this.bottomPage.setArea(this.calc.getBottomClipArea());
            this.bottomPage.setPosition(this.calc.getBottomPagePosition());
            this.bottomPage.setAngle(0);
            this.bottomPage.setHardAngle(0);

            this.flippingPage.setArea(this.calc.getFlippingClipArea());
            this.flippingPage.setPosition(this.calc.getActiveCorner());
            this.flippingPage.setAngle(this.calc.getAngle());

            if (this.calc.getDirection() === FlipDirection.FORWARD) {
                this.flippingPage.setHardAngle((90 * (200 - progress * 2)) / 100);
            } else {
                this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
            }

            this.render.setPageRect(this.calc.getRect());
            this.render.setBottomPage(this.bottomPage);
            this.render.setFlippingPage(this.flippingPage);
            this.render.setShadowData(
                this.calc.getShadowStartPoint(),
                this.calc.getShadowAngle(),
                progress,
                this.calc.getDirection()
            );
        }
    }

    // 指定されたページ番号へフリップする
    public flipToPage(page: number, corner: FlipCorner): void {
        const current = this.app.getPageCollection().getCurrentSpreadIndex();
        const next = this.app.getPageCollection().getSpreadIndexByPage(page);

        try {
            if (typeof next === 'number') {
                if (next > current) {
                    this.app.getPageCollection().setCurrentSpreadIndex(next - 1);
                    this.flipNext(corner);
                }
                if (next < current) {
                    this.app.getPageCollection().setCurrentSpreadIndex(next + 1);
                    this.flipPrev(corner);
                }
            }
        } catch {}
    }

    // 次のページをフリップする処理
    public flipNext(corner: FlipCorner): void {
        this.flip({
            x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    // 前のページをフリップする処理
    public flipPrev(corner: FlipCorner): void {
        this.flip({
            x: 10,
            y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
        });
    }

    // マウス操作の終了に伴い、めくり動作を完了させる処理
    public stopMove(): void {
        if (!this.calc) return;

        const pos = this.calc.getPosition();
        const rect = this.getBoundsRect();
        const y = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

        if (pos.x <= 0) this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
        else this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
    }

    // 角にマウスを置いた際に、角を少し折るアニメーションを表示
    public showCorner(globalPos: Point): void {
        if (!this.checkState(FlippingState.READ, FlippingState.FOLD_CORNER)) return;

        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;

        if (this.isPointOnCorners(globalPos)) {
            if (this.calc === null && !this.start(globalPos)) return;

            this.setState(FlippingState.FOLD_CORNER);

            this.calc!.calc({ x: pageWidth - 1, y: 1 });

            const fixedCornerSize = 50;
            const yStart = this.calc!.getCorner() === FlipCorner.BOTTOM ? rect.height - 1 : 1;
            const yDest = this.calc!.getCorner() === FlipCorner.BOTTOM ? rect.height - fixedCornerSize : fixedCornerSize;

            this.animateFlippingTo(
                { x: pageWidth - 1, y: yStart },
                { x: pageWidth - fixedCornerSize, y: yDest },
                false,
                false
            );
        } else {
            this.setState(FlippingState.READ);
            this.render.finishAnimation();
            this.stopMove();
        }
    }

    // フリップアニメーションを補間で実行する関数
    private animateFlippingTo(start: Point, dest: Point, isTurned: boolean, needReset = true): void {
        const points = Helper.getCoordsFromTwoPoints(start, dest);
        const frames = points.map((p) => () => this.do(p));
        const duration = this.getAnimationDuration(points.length);

        this.render.startAnimation(frames, duration, () => {
            if (!this.calc) return;

            if (isTurned) {
                if (this.calc.getDirection() === FlipDirection.BACK) this.app.turnToPrevPage();
                else this.app.turnToNextPage();
            }

            if (needReset) {
                this.render.setBottomPage(null as unknown as Page);
                this.render.setFlippingPage(null as unknown as Page);
                this.render.clearShadow();

                this.setState(FlippingState.READ);
                this.reset();
            }
        });
    }

    // その他のヘルパー関数
    public getCalculation(): FlipCalculation | null {
        return this.calc;
    }

    public getState(): FlippingState {
        return this.state;
    }

    private setState(newState: FlippingState): void {
        if (this.state !== newState) {
            this.app.updateState(newState);
            this.state = newState;
        }
    }

    // タッチされた位置から方向（前 or 次）を判断する
    private getDirectionByPoint(touchPos: Point): FlipDirection {
        const rect = this.getBoundsRect();
        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            if (touchPos.x - rect.pageWidth <= rect.width / 5) return FlipDirection.BACK;
        } else if (touchPos.x < rect.width / 2) return FlipDirection.BACK;
        return FlipDirection.FORWARD;
    }

    private getAnimationDuration(size: number): number {
        const defaultTime = this.app.getSettings().flippingTime;
        return size >= 1000 ? defaultTime : (size / 1000) * defaultTime;
    }

    private checkDirection(direction: FlipDirection): boolean {
        return direction === FlipDirection.FORWARD
            ? this.app.getCurrentPageIndex() < this.app.getPageCount() - 1
            : this.app.getCurrentPageIndex() >= 1;
    }

    private reset(): void {
        this.calc = null;
        this.flippingPage = null;
        this.bottomPage = null;
    }

    private getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    private checkState(...states: FlippingState[]): boolean {
        return states.includes(this.state);
    }

    // カーソルが角にあるかどうかを判定（折れるアニメーション対象か）
    private isPointOnCorners(globalPos: Point): boolean {
        const rect = this.getBoundsRect();
        const pageWidth = rect.pageWidth;
        const operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
        const bookPos = this.render.convertToBook(globalPos);

        return (
            bookPos.x > 0 &&
            bookPos.y > 0 &&
            bookPos.x < rect.width &&
            bookPos.y < rect.height &&
            (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
            (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
        );
    }
}
