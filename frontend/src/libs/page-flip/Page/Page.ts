import { Render } from '../Render/Render.ts';
import { Point } from '../BasicTypes.ts';

/**
 * ページの状態を定義するインターフェース。
 * 描画時に使用される回転角やポジション、クリップ範囲などを保持します。
 */
export interface PageState {
    /** ソフトページの回転角（ラジアン） */
    angle: number;

    /** ページの切り抜き領域（clip-pathで使われる多角形の頂点） */
    area: Point[];

    /** ページの位置（グローバル座標系） */
    position: Point;

    /** ハードページの物理的な回転角（状態） */
    hardAngle: number;

    /** ハードページの描画時の回転角（描画用） */
    hardDrawingAngle: number;
}

/**
 * ページの左右を表す列挙型（左ページ／右ページ）
 */
export const enum PageOrientation {
    /** 本の左ページ（見開き時の左） */
    LEFT,

    /** 本の右ページ（見開き時の右） */
    RIGHT,
}

/**
 * ページの密度（硬さ）を表す列挙型
 */
export const enum PageDensity {
    /** 柔らかいページ（通常の紙） */
    SOFT = 'soft',

    /** 硬いページ（表紙など） */
    HARD = 'hard',
}

/**
 * ページの基本動作を定義する抽象クラス。
 * すべてのページはこのクラスを継承して実装されます（HTMLPage, CanvasPage など）
 */
export abstract class Page {
    /** 現在のページ状態（角度、位置、clip領域など） */
    protected state: PageState;

    /** 描画管理オブジェクト（Render.ts） */
    protected render: Render;

    /** ページの左右の位置（LEFT or RIGHT） */
    protected orientation: PageOrientation;

    /** 作成時の密度（固定） */
    protected createdDensity: PageDensity;

    /** 描画時の密度（隣のページによって変わることがある） */
    protected nowDrawingDensity: PageDensity;

    /**
     * コンストラクタ。ページ状態と密度を初期化します。
     */
    protected constructor(render: Render, density: PageDensity) {
        this.state = {
            angle: 0,
            area: [],
            position: { x: 0, y: 0 },
            hardAngle: 0,
            hardDrawingAngle: 0,
        };

        this.createdDensity = density;
        this.nowDrawingDensity = this.createdDensity;

        this.render = render;
    }

    /**
     * シンプルな静的描画（めくられていない通常表示）
     * @param {PageOrientation} orient - ページの左右位置
     */
    public abstract simpleDraw(orient: PageOrientation): void;

    /**
     * 状態に基づいたページ描画（アニメーション中など）
     * @param {PageDensity} tempDensity - 一時的な密度（省略可能）
     */
    public abstract draw(tempDensity?: PageDensity): void;

    /**
     * ページの初期読み込み処理（コンテンツの準備など）
     */
    public abstract load(): void;

    /**
     * 固定のページ密度を設定
     * @param {PageDensity} density - ソフト or ハード
     */
    public setDensity(density: PageDensity): void {
        this.createdDensity = density;
        this.nowDrawingDensity = density;
    }

    /**
     * 次回描画時に使う密度を一時的に設定
     */
    public setDrawingDensity(density: PageDensity): void {
        this.nowDrawingDensity = density;
    }

    /**
     * ページの描画位置を設定
     * @param {Point} pagePos - グローバル座標
     */
    public setPosition(pagePos: Point): void {
        this.state.position = pagePos;
    }

    /**
     * ページの角度（ソフト）を設定
     * @param {number} angle - 回転角（ラジアン）
     */
    public setAngle(angle: number): void {
        this.state.angle = angle;
    }

    /**
     * ページのclip領域を設定
     * @param {Point[]} area - clip-path用の多角形
     */
    public setArea(area: Point[]): void {
        this.state.area = area;
    }

    /**
     * 次回描画時のハードページの回転角（描画用）
     */
    public setHardDrawingAngle(angle: number): void {
        this.state.hardDrawingAngle = angle;
    }

    /**
     * ハードページの状態としての回転角を設定
     */
    public setHardAngle(angle: number): void {
        this.state.hardAngle = angle;
        this.state.hardDrawingAngle = angle;
    }

    /**
     * ページの左右向きを設定（LEFT / RIGHT）
     */
    public setOrientation(orientation: PageOrientation): void {
        this.orientation = orientation;
    }

    /**
     * 現在の描画密度を取得
     */
    public getDrawingDensity(): PageDensity {
        return this.nowDrawingDensity;
    }

    /**
     * 固定のページ密度を取得
     */
    public getDensity(): PageDensity {
        return this.createdDensity;
    }

    /**
     * ハードページの回転角を取得
     */
    public getHardAngle(): number {
        return this.state.hardAngle;
    }

    /**
     * ページの一時コピーを新規作成（アニメーション用）
     */
    public abstract newTemporaryCopy(): Page;

    /**
     * 一時コピーされたページを取得
     */
    public abstract getTemporaryCopy(): Page;

    /**
     * 一時コピーを非表示または破棄する
     */
    public abstract hideTemporaryCopy(): void;
}
