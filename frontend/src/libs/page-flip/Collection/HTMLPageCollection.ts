// 必要なクラスや型のインポート
import { HTMLPage } from '../Page/HTMLPage.ts';                // HTMLページの具体的な表示処理を担うクラス
import { Render } from '../Render/Render.ts';                  // 描画を制御するクラス
import { PageCollection } from './PageCollection.ts';          // ページ集合のベースクラス
import { PageFlip } from '../PageFlip.ts';                     // メインコントローラクラス
import { PageDensity } from '../Page/Page.ts';                 // ページの密度（HARD or SOFT）定義

/**
 * HTML 要素をベースとしたページコレクションのクラス
 * - 複数の HTML 要素をページとしてまとめて管理
 */
export class HTMLPageCollection extends PageCollection {
    private readonly element: HTMLElement;                                     // ページ全体を包含する親HTML要素
    private readonly pagesElement: NodeListOf<HTMLElement> | HTMLElement[];   // 実際のページコンテンツ（HTML要素群）

    // コンストラクタ：PageFlip本体、描画コンポーネント、HTML要素を受け取る
    constructor(
        app: PageFlip,                                                        // PageFlipインスタンス（状態管理の中核）
        render: Render,                                                       // 描画クラス（HTMLRenderなど）
        element: HTMLElement,                                                 // 全体を囲むHTML要素
        items: NodeListOf<HTMLElement> | HTMLElement[]                        // 各ページとして表示する要素リスト
    ) {
        super(app, render);                                                   // PageCollection のコンストラクタを呼び出し

        this.element = element;                                               // ルートHTML要素を保存
        this.pagesElement = items;                                            // ページ要素群を保存
    }

    /**
     * ページ要素を HTMLPage として読み込み、ページコレクションに追加する
     */
    public load(): void {
        for (const pageElement of this.pagesElement) {
            // 各ページ要素から HTMLPage インスタンスを作成
            const page = new HTMLPage(
                this.render,                                                  // 描画インスタンス
                pageElement,                                                  // 対象のHTML要素
                pageElement.dataset['density'] === 'hard'                     // data-density が "hard" の場合はHARD、それ以外はSOFT
                    ? PageDensity.HARD
                    : PageDensity.SOFT
            );

            page.load();                  // ページの初期化処理（HTML構造・スタイル読み込みなど）
            this.pages.push(page);        // PageCollectionの配列に追加
        }

        this.createSpread();              // ページの見開き構造（spread）を作成（2ページ表示の割当）
    }
}
