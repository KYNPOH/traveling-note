/**
 * 📐 座標系・図形の基本型定義ファイル
 * 
 * このファイルでは、ページの描画やアニメーション処理に必要な
 * 基本的な幾何情報（点・矩形・線分など）を TypeScript の型で定義しています。
 * UI座標計算やページ角度の変化など、様々な場面で利用されます。
 */

/**
 * 任意の2次元平面上の点を表す型
 * x: 横方向の位置、y: 縦方向の位置
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * 矩形の4隅の座標をまとめて表す型
 */
export interface RectPoints {
    /** 左上の点（top-left corner） */
    topLeft: Point;
    /** 右上の点（top-right corner） */
    topRight: Point;
    /** 左下の点（bottom-left corner） */
    bottomLeft: Point;
    /** 右下の点（bottom-right corner） */
    bottomRight: Point;
}

/**
 * 通常の矩形を表す型
 * left, top は左上の基準点の座標
 * width, height は矩形の幅と高さ
 */
export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * 本のページ領域を表すための矩形情報
 * 通常の Rect に加えて pageWidth を持つ
 */
export interface PageRect {
    left: number;
    top: number;
    width: number;
    height: number;

    /**
     * ページ幅：
     * - 縦表示（portrait）の場合は本の幅と等しい
     * - 横表示（landscape）の場合は本の幅の半分（見開き1ページ分）
     */
    pageWidth: number;
}

/**
 * 始点と終点の2点で構成される線分（segment）
 */
export type Segment = [Point, Point];
