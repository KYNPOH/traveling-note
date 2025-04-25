// 各種モジュールをインポート
import { PageCollection } from './Collection/PageCollection.ts';
import { ImagePageCollection } from './Collection/ImagePageCollection.ts';
import { HTMLPageCollection } from './Collection/HTMLPageCollection.ts';
import { PageRect, Point } from './BasicTypes.ts';
import { Flip, FlipCorner, FlippingState } from './Flip/Flip.ts';
import { Orientation, Render } from './Render/Render.ts';
import { CanvasRender } from './Render/CanvasRender.ts';
import { HTMLUI } from './UI/HTMLUI.ts';
import { CanvasUI } from './UI/CanvasUI.ts';
import { Helper } from './Helper.ts';
import { Page } from './Page/Page.ts';
import { EventObject } from './Event/EventObject.ts';
import { HTMLRender } from './Render/HTMLRender.ts';
import { FlipSetting, Settings } from './Settings.ts';
import { UI } from './UI/UI.ts';

import './Style/stPageFlip.css';

/**
 * 📘 PageFlip クラス：ページめくり機能のメイン制御クラス
 */
export class PageFlip extends EventObject {
  // ユーザーのマウス／タッチ位置管理用
  private mousePosition: Point = { x: 0, y: 0 };
  private isUserTouch = false;
  private isUserMove = false;

  // 設定値と親要素参照
  private readonly setting: FlipSetting;
  private readonly block: HTMLElement;

  // 内部で使用される主要コンポーネント
  private pages!: PageCollection;
  private flipController!: Flip;
  private render!: Render;
  private ui!: UI;

  constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>) {
    super();
    this.setting = new Settings().getSettings(setting);
    this.block = inBlock;
  }

  /** すべてのコンポーネントと要素を破棄する */
  public destroy(): void {
    this.ui?.destroy();
    this.block.remove();
  }

  /** UI・ページ表示を更新 */
  public update(): void {
    this.render.update();
    this.pages.show();
  }

  /** 画像データからページを読み込み */
  public loadFromImages(imagesHref: string[]): void {
    this.ui = new CanvasUI(this.block, this, this.setting);
    const canvas = (this.ui as CanvasUI).getCanvas();
    this.render = new CanvasRender(this, this.setting, canvas);
    this.flipController = new Flip(this.render, this);
    this.pages = new ImagePageCollection(this, this.render, imagesHref);

    this.pages.load();
    this.render.start();
    this.pages.show(this.setting.startPage);

    setTimeout(() => {
      this.ui.update();
      this.trigger('init', this, {
        page: this.setting.startPage,
        mode: this.render.getOrientation(),
      });
    }, 1);
  }

  /** HTML要素からページを読み込み */
  public loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
    this.ui = new HTMLUI(this.block, this, this.setting, items);
    this.render = new HTMLRender(this, this.setting, this.ui.getDistElement());
    this.flipController = new Flip(this.render, this);
    this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);

    this.pages.load();
    this.render.start();
    this.pages.show(this.setting.startPage);

    setTimeout(() => {
      this.ui.update();
      this.trigger('init', this, {
        page: this.setting.startPage,
        mode: this.render.getOrientation(),
      });
    }, 1);
  }

  /** 画像ページの内容を更新（ページ入れ替え） */
  public updateFromImages(imagesHref: string[]): void {
    const current = this.pages.getCurrentPageIndex();
    this.pages.destroy();
    this.pages = new ImagePageCollection(this, this.render, imagesHref);
    this.pages.load();
    this.pages.show(current);

    this.trigger('update', this, {
      page: current,
      mode: this.render.getOrientation(),
    });
  }

  /** HTMLページの内容を更新 */
  public updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
    const current = this.pages.getCurrentPageIndex();
    this.pages.destroy();
    this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
    this.pages.load();
    (this.ui as HTMLUI).updateItems(items);
    this.render.reload();
    this.pages.show(current);

    this.trigger('update', this, {
      page: current,
      mode: this.render.getOrientation(),
    });
  }

  /** ページとUIを初期状態に戻す */
  public clear(): void {
    this.pages.destroy();
    (this.ui as HTMLUI).clear();
  }

  /** 前ページを表示 */
  public turnToPrevPage(): void {
    this.pages.showPrev();
  }

  /** 次ページを表示 */
  public turnToNextPage(): void {
    this.pages.showNext();
  }

  /** 指定ページに移動 */
  public turnToPage(page: number): void {
    this.pages.show(page);
  }

  /** 次ページにアニメーション付きでめくる */
  public flipNext(corner: FlipCorner = FlipCorner.TOP): void {
    this.flipController.flipNext(corner);
  }

  /** 前ページにアニメーション付きでめくる */
  public flipPrev(corner: FlipCorner = FlipCorner.TOP): void {
    this.flipController.flipPrev(corner);
  }

  /** 指定ページにアニメーション付きでめくる */
  public flip(page: number, corner: FlipCorner = FlipCorner.TOP): void {
    this.flipController.flipToPage(page, corner);
  }

  /** 状態変更イベントを通知 */
  public updateState(newState: FlippingState): void {
    this.trigger('changeState', this, newState);
  }

  /** ページ変更イベントを通知 */
  public updatePageIndex(newPage: number): void {
    this.trigger('flip', this, newPage);
  }

  /** 画面の向き（横/縦）を更新 */
  public updateOrientation(newOrientation: Orientation): void {
    this.ui.setOrientationStyle(newOrientation);
    this.update();
    this.trigger('changeOrientation', this, newOrientation);
  }

  /** 総ページ数を取得 */
  public getPageCount(): number {
    return this.pages.getPageCount();
  }

  /** 現在のページ番号を取得 */
  public getCurrentPageIndex(): number {
    return this.pages.getCurrentPageIndex();
  }

  /** 指定インデックスのページを取得 */
  public getPage(pageIndex: number): Page {
    return this.pages.getPage(pageIndex);
  }

  /** レンダラーを取得（Canvas / HTML） */
  public getRender(): Render {
    return this.render;
  }

  /** フリップ操作の制御クラスを取得 */
  public getFlipController(): Flip {
    return this.flipController;
  }

  /** 現在の向きを取得 */
  public getOrientation(): Orientation {
    return this.render.getOrientation();
  }

  /** 本全体の描画領域サイズを取得 */
  public getBoundsRect(): PageRect {
    return this.render.getRect();
  }

  /** 設定値を取得 */
  public getSettings(): FlipSetting {
    return this.setting;
  }

  /** UIコントローラを取得 */
  public getUI(): UI {
    return this.ui;
  }

  /** 現在の状態（READ, FLIPPINGなど）を取得 */
  public getState(): FlippingState {
    return this.flipController.getState();
  }

  /** ページコレクションの参照を取得 */
  public getPageCollection(): PageCollection {
    return this.pages;
  }

  /** ユーザーのタッチ開始時に呼ばれる */
  public startUserTouch(pos: Point): void {
    this.mousePosition = pos;
    this.isUserTouch = true;
    this.isUserMove = false;
  }

  /** ユーザーの動き（マウス移動やタッチ移動）に反応 */
  public userMove(pos: Point, isTouch: boolean): void {
    if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
      this.flipController.showCorner(pos);
    } else if (this.isUserTouch) {
      if (Helper.getDistanceBetweenTwoPoints(this.mousePosition, pos) > 5) {
        this.isUserMove = true;
        this.flipController.fold(pos);
      }
    }
  }

  /** タッチ終了時の処理（スワイプ or 通常フリップ判定） */
  public userStop(pos: Point, isSwipe = false): void {
    if (this.isUserTouch) {
      this.isUserTouch = false;

      if (!isSwipe) {
        if (!this.isUserMove) {
          this.flipController.flip(pos);
        } else {
          this.flipController.stopMove();
        }
      }
    }
  }
}
