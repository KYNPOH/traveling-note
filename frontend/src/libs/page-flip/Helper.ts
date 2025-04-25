import { Point, Rect, Segment } from './BasicTypes.ts';

/**
 * 📐 Helper クラス
 * 
 * ページの回転、衝突判定、図形の計算など、
 * ページフリップ演出やレンダリングに関わる数学的な処理を集約したユーティリティクラスです。
 */
export class Helper {

    /**
     * 2点間の距離を計算（ユークリッド距離）
     */
    public static getDistanceBetweenTwoPoints(point1: Point | null, point2: Point | null): number {
        if (!point1 || !point2) return Infinity;
        return Math.hypot(point2.x - point1.x, point2.y - point1.y);
    }

    /**
     * 線分（始点・終点）の長さを取得
     */
    public static getSegmentLength(segment: Segment): number {
        return Helper.getDistanceBetweenTwoPoints(segment[0], segment[1]);
    }

    /**
     * 2つの線分が成す角度（ラジアン）を取得
     */
    public static getAngleBetweenTwoLines(line1: Segment, line2: Segment): number {
        const A1 = line1[0].y - line1[1].y;
        const A2 = line2[0].y - line2[1].y;
        const B1 = line1[1].x - line1[0].x;
        const B2 = line2[1].x - line2[0].x;

        const dotProduct = A1 * A2 + B1 * B2;
        const magnitude1 = Math.sqrt(A1 * A1 + B1 * B1);
        const magnitude2 = Math.sqrt(A2 * A2 + B2 * B2);

        return Math.acos(dotProduct / (magnitude1 * magnitude2));
    }

    /**
     * 指定された点が矩形内に存在するかを判定
     */
    public static pointInRect(rect: Rect, pos: Point | null): Point | null {
        if (!pos) return null;
        if (
            pos.x >= rect.left &&
            pos.x <= rect.left + rect.width &&
            pos.y >= rect.top &&
            pos.y <= rect.top + rect.height
        ) {
            return pos;
        }
        return null;
    }

    /**
     * 指定角度で原点から回転させた点の座標を取得
     */
    public static getRotatedPoint(transformed: Point, origin: Point, angle: number): Point {
        return {
            x: transformed.x * Math.cos(angle) + transformed.y * Math.sin(angle) + origin.x,
            y: transformed.y * Math.cos(angle) - transformed.x * Math.sin(angle) + origin.y,
        };
    }

    /**
     * 与えられた点を円内（center, radius）に制限して返す
     * （中心点から一定距離以上ははみ出さないように制限）
     */
    public static limitPointToCircle(center: Point, radius: number, target: Point): Point {
        const distance = Helper.getDistanceBetweenTwoPoints(center, target);
        if (distance <= radius) return target;

        const dx = target.x - center.x;
        const dy = target.y - center.y;
        const scale = radius / distance;

        return {
            x: center.x + dx * scale,
            y: center.y + dy * scale,
        };
    }

    /**
     * 2つの線分の交点が矩形内に存在するかを判定し、その交点を返す
     */
    public static getIntersectBetweenTwoSegments(rect: Rect, one: Segment, two: Segment): Point | null {
        const intersection = Helper.getIntersectBetweenTwoLines(one, two);
        return Helper.pointInRect(rect, intersection);
    }

    /**
     * 2つの線分の延長線上の交点を計算
     * 交差しない場合は null、重なり合う場合は例外を投げる
     */
    public static getIntersectBetweenTwoLines(one: Segment, two: Segment): Point | null {
        const A1 = one[0].y - one[1].y;
        const B1 = one[1].x - one[0].x;
        const C1 = one[0].x * one[1].y - one[1].x * one[0].y;

        const A2 = two[0].y - two[1].y;
        const B2 = two[1].x - two[0].x;
        const C2 = two[0].x * two[1].y - two[1].x * two[0].y;

        const denominator = A1 * B2 - A2 * B1;

        if (denominator === 0) {
            // 線分が一致している可能性（重なり）
            if (Math.abs(C1 * B2 - C2 * B1) < 0.1) throw new Error('Segment included');
            return null;
        }

        const x = -((C1 * B2 - C2 * B1) / denominator);
        const y = -((A1 * C2 - A2 * C1) / denominator);

        return { x, y };
    }

    /**
     * 2点間の線分を等間隔で分割し、その途中点座標の配列を返す
     * アニメーションのフレーム生成などに利用される
     */
    public static getCoordsFromTwoPoints(p1: Point, p2: Point): Point[] {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.max(Math.abs(dx), Math.abs(dy));

        const result: Point[] = [];
        for (let i = 0; i <= length; i++) {
            const x = p1.x + (dx * i) / length;
            const y = p1.y + (dy * i) / length;
            result.push({ x, y });
        }
        return result;
    }
}
