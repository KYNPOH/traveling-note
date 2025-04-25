// 必要なクラスや型をインポート
import { ImagePage } from '../Page/ImagePage.ts';        // 画像ベースのページを表すクラス
import { Render } from '../Render/Render.ts';            // 描画（レンダリング）機能
import { PageCollection } from './PageCollection.ts';    // ページの集合（抽象クラス）
import { PageFlip } from '../PageFlip.ts';               // メインアプリケーションクラス
import { PageDensity } from '../Page/Page.ts';           // ページの密度（soft/hard）

/**
 * Canvas上に画像をページとして表示するページコレクションクラス
 * HTMLPageCollectionと同様の構造をもつが、ImagePageを利用
 */
export class ImagePageCollection extends PageCollection {
    /** 読み込む画像のURL配列 */
    private readonly imagesHref: string[];

    /**
     * コンストラクタ
     * @param app - ページフリップアプリケーションのインスタンス
     * @param render - 描画を担当するレンダラ（CanvasRender）
     * @param imagesHref - 表示する画像のURL一覧
     */
    constructor(app: PageFlip, render: Render, imagesHref: string[]) {
        super(app, render); // 基底のPageCollectionを初期化

        this.imagesHref = imagesHref; // 画像URLを保存
    }

    /**
     * ページ画像の読み込み処理
     * - 各画像URLに対応する ImagePage インスタンスを作成
     * - ページリストに追加
     * - スプレッド（見開き）を構築
     */
    public load(): void {
        for (const href of this.imagesHref) {
            // ページを生成（デフォルトでは SOFT ページとして）
            const page = new ImagePage(this.render, href, PageDensity.SOFT);

            // ページの初期読み込み処理
            page.load();

            // ページリストに追加
            this.pages.push(page);
        }

        // 見開きスプレッドを構築（PageCollectionに定義されている）
        this.createSpread();
    }
}
