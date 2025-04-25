/**
 * 📏 本のサイズ計算タイプ
 */
export const enum SizeType {
    /** 固定サイズ */
    FIXED = 'fixed',
    /** 親要素のサイズに追従（リキッド対応） */
    STRETCH = 'stretch',
}

/**
 * 📘 ページフリップ設定の型定義（構成要素）
 */
export interface FlipSetting {
    /** 開始ページ番号（0ベース） */
    startPage: number;

    /** サイズのタイプ（固定 or 親に追従） */
    size: SizeType;

    /** 固定サイズモードでの幅と高さ（ピクセル） */
    width: number;
    height: number;

    /** stretchモードで使用する最小・最大サイズの制限値 */
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;

    /** ページをめくる際に影を描画するかどうか */
    drawShadow: boolean;

    /** ページをめくるアニメーションの時間（ミリ秒） */
    flippingTime: number;

    /** 縦向き表示（1ページ）を許可するかどうか */
    usePortrait: boolean;

    /** z-index の起点 */
    startZIndex: number;

    /** 自動サイズ調整を行うか（親に合わせて100%表示） */
    autoSize: boolean;

    /** 影の最大不透明度（0〜1） */
    maxShadowOpacity: number;

    /** 表紙（最初と最後のページ）を「ハード」扱いし、単ページ表示とするか */
    showCover: boolean;

    /** モバイルでのスクロール禁止（本を触った時） */
    mobileScrollSupport: boolean;

    /** `<a>` や `<button>` タグのクリックイベントを許可するかどうか */
    clickEventForward: boolean;

    /** マウス・タッチ操作によるページめくりを許可するかどうか */
    useMouseEvents: boolean;

    /** スワイプを検知する距離（px） */
    swipeDistance: number;

    /** コーナーをめくるアニメーション表示を有効にするか */
    showPageCorners: boolean;

    /** 本全体をクリックしたときのページめくりを禁止するか（コーナーのみ許可） */
    disableFlipByClick: boolean;
}

/**
 * ⚙️ Settings クラス：ユーザーから渡された設定とデフォルトをマージする
 */
export class Settings {
    // 🔧 デフォルト設定（内部用）
    private _default: FlipSetting = {
        startPage: 0,
        size: SizeType.FIXED,
        width: 0,
        height: 0,
        minWidth: 0,
        maxWidth: 0,
        minHeight: 0,
        maxHeight: 0,
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 1,
        showCover: false,
        mobileScrollSupport: true,
        swipeDistance: 30,
        clickEventForward: true,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
    };

    /**
     * 🎛 ユーザーから渡された設定を加工し、最終的な FlipSetting を返す
     * 
     * @param userSetting - ユーザーが指定した設定項目（任意）
     * @returns FlipSetting - 加工済みの設定オブジェクト
     */
    public getSettings(userSetting: Record<string, number | string | boolean>): FlipSetting {
        const result = this._default;
        Object.assign(result, userSetting); // ユーザー設定をマージ

        // バリデーション：`size` は固定かストレッチのどちらか
        if (result.size !== SizeType.STRETCH && result.size !== SizeType.FIXED)
            throw new Error('Invalid size type. Available only "fixed" and "stretch" value');

        // `width` / `height` の値チェック
        if (result.width <= 0 || result.height <= 0)
            throw new Error('Invalid width or height');

        // アニメーション時間のチェック
        if (result.flippingTime <= 0)
            throw new Error('Invalid flipping time');

        // STRETCHモードのとき、最小・最大サイズの整合性を補正
        if (result.size === SizeType.STRETCH) {
            if (result.minWidth <= 0) result.minWidth = 100;
            if (result.maxWidth < result.minWidth) result.maxWidth = 2000;
            if (result.minHeight <= 0) result.minHeight = 100;
            if (result.maxHeight < result.minHeight) result.maxHeight = 2000;
        } else {
            // FIXEDモードでは min/max を width/height に統一
            result.minWidth = result.width;
            result.maxWidth = result.width;
            result.minHeight = result.height;
            result.maxHeight = result.height;
        }

        return result;
    }
}
