// UI クラスのベース、PageFlip 本体、設定をインポート
import { UI } from './UI.ts';
import { PageFlip } from '../PageFlip.ts';
import { FlipSetting } from '../Settings.ts';

/**
 * 📄 HTMLモード用のUIクラス
 *
 * HTMLページモードでの UI 表示やイベント管理を担当する。
 * - `HTMLPageCollection` に対応
 * - HTML 要素をレンダリング対象に使う
 * - 要素の移動や更新、イベントの管理なども担当
 */
export class HTMLUI extends UI {
    // HTMLページとして使われる要素のリスト
    private items: HTMLElement[];

    /**
     * コンストラクタ
     *
     * @param inBlock - 親要素
     * @param app - PageFlip インスタンス
     * @param setting - 設定情報
     * @param items - ページとして使用される HTML 要素のリスト
     */
    constructor(
        inBlock: HTMLElement,
        app: PageFlip,
        setting: FlipSetting,
        items: NodeListOf<HTMLElement> | HTMLElement[]
    ) {
        // ベースクラス UI を初期化
        super(inBlock, app, setting);

        // HTMLページを格納するラッパーを追加
        this.wrapper.insertAdjacentHTML('afterbegin', '<div class="stf__block"></div>');

        // `.stf__block` を取得して描画対象要素として設定
        const dist = this.wrapper.querySelector('.stf__block');
        if (!dist) throw new Error("'.stf__block' element not found");
        this.distElement = dist as HTMLElement;

        // ページとして使う要素を distElement に追加
        this.items = Array.from(items);
        for (const item of this.items) {
            this.distElement.appendChild(item);
        }

        // イベントハンドラを登録（UI.ts で共通処理）
        this.setHandlers();
    }

    /**
     * UIをクリアする（すべてのHTML要素を親に戻す）
     */
    public clear(): void {
        for (const item of this.items) {
            this.parentElement.appendChild(item);
        }
    }

    /**
     * HTML要素のリストを新しく差し替えて UI を更新する
     *
     * @param items - 新しい HTML 要素の配列
     */
    public updateItems(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        // 既存のイベントハンドラを削除
        this.removeHandlers();

        // 中身を一度クリア
        this.distElement.innerHTML = '';

        // 新しい HTML 要素を描画対象に設定
        const itemArray = Array.from(items);
        for (const item of itemArray) {
            this.distElement.appendChild(item);
        }
        this.items = itemArray;

        // 新しい要素に対してイベントハンドラを再登録
        this.setHandlers();
    }

    /**
     * UI を更新（再描画をトリガー）
     */
    public update(): void {
        this.app.getRender().update();
    }
}
