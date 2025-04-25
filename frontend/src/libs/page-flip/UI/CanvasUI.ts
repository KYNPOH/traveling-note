import { UI } from "./UI.ts";
import { PageFlip } from "../PageFlip.ts";
import { FlipSetting } from "../Settings.ts";

/**
 * Canvas モード用の UI クラス。
 * HTML 上に `<canvas>` 要素を生成・管理し、CanvasRenderer の出力先として機能。
 * また、リサイズやイベントハンドリングも担う。
 */
export class CanvasUI extends UI {
    // 管理する canvas 要素
    private readonly canvas: HTMLCanvasElement;

    /**
     * コンストラクタ：Canvas UI の初期化
     * - 親要素に canvas を挿入
     * - canvas を取得して distElement に設定
     * - canvas サイズを調整し、イベントハンドラを登録
     */
    constructor(inBlock: HTMLElement, app: PageFlip, setting: FlipSetting) {
        // UI ベースクラスの初期化
        super(inBlock, app, setting);

        // ラッパー内部に canvas 要素を挿入
        this.wrapper.innerHTML = '<canvas class="stf__canvas"></canvas>';

        // DOM から canvas 要素を取得（複数存在する場合の先頭）
        this.canvas = inBlock.querySelectorAll('canvas')[0];

        // 描画対象要素をこの canvas に設定
        this.distElement = this.canvas;

        // canvas のピクセルサイズを CSS サイズに合わせて設定
        this.resizeCanvas();

        // イベントハンドラー登録（UI ベースクラス側で定義）
        this.setHandlers();
    }

    /**
     * canvas 要素のサイズを、実際の CSS 表示サイズに合わせてピクセルサイズを設定
     * （高解像度画面などでボケを防ぐため）
     */
    private resizeCanvas(): void {
        // CSS に基づく表示サイズを取得
        const cs = getComputedStyle(this.canvas);
        const width = parseInt(cs.getPropertyValue('width'), 10);
        const height = parseInt(cs.getPropertyValue('height'), 10);

        // canvas のピクセルサイズを設定
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * 管理対象の canvas 要素を返す
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * UI の更新処理
     * - canvas サイズを再調整
     * - レンダラの再描画をトリガー
     */
    public update(): void {
        this.resizeCanvas();                 // リサイズ処理
        this.app.getRender().update();      // Renderer の再描画を要求
    }
}
