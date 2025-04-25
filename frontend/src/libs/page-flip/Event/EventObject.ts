// PageFlip クラスの参照（イベントで渡すオブジェクトとして使用）
import { PageFlip } from '../PageFlip.ts';

/**
 * イベントハンドラに渡すデータの型。
 * 任意のプリミティブ型やオブジェクトが許容される。
 */
export type DataType = number | string | boolean | object | undefined;

/**
 * イベントハンドラに渡されるイベントオブジェクトの構造。
 * - `data`: イベント発生時の追加データ
 * - `object`: PageFlip のインスタンス
 */
export interface WidgetEvent {
    data: DataType;
    object: PageFlip;
}

/**
 * イベントコールバック関数の型。
 * 引数に WidgetEvent を受け取る。
 */
export type EventCallback = (e: WidgetEvent) => void;

/**
 * シンプルなイベント管理の基底クラス。
 * PageFlip などでイベントリスナーの登録・解除・発火を行うために使用。
 */
export abstract class EventObject {
    /** イベント名とコールバック配列を関連付けるマップ */
    private events: Map<string, EventCallback[]> = new Map();

    /**
     * イベントリスナーを登録する
     *
     * @param eventName - イベント名（文字列）
     * @param callback - 実行するコールバック関数
     * @returns this - チェーン可能
     */
    public on(eventName: string, callback: EventCallback): this {
        const existing = this.events.get(eventName);

        if (existing) {
            // 既存のリスナーがあれば追加
            existing.push(callback);
        } else {
            // なければ新しいリストを作成
            this.events.set(eventName, [callback]);
        }

        return this;
    }

    /**
     * 特定のイベント名に登録されているすべてのコールバックを削除する
     *
     * @param event - 削除対象のイベント名
     */
    public off(event: string): void {
        this.events.delete(event);
    }

    /**
     * 登録されたイベントを実行（イベントを発火）
     *
     * @param eventName - 発火させたいイベント名
     * @param app - PageFlip のインスタンス（コールバックに渡す）
     * @param data - コールバックに渡す追加データ（任意）
     */
    protected trigger(eventName: string, app: PageFlip, data?: DataType): void {
        const handlers = this.events.get(eventName);
        if (!handlers) return;

        // 各ハンドラを呼び出す
        for (const callback of handlers) {
            callback({ data, object: app });
        }
    }
}
