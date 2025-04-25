import { Helper } from '../Helper.ts';
import { Point, Rect, RectPoints, Segment } from '../BasicTypes.ts';
import { FlipCorner, FlipDirection } from './Flip.ts';

// このクラスはページめくり時の角度、ポジション、クリップ領域、影などの計算を行う
export class FlipCalculation {
    private angle: number; // 現在の角度（ラジアン）
    private position: Point; // 現在の角の位置
    private rect: RectPoints; // 現在のページ領域の頂点座標

    private topIntersectPoint: Point | null = null; // 上辺との交点
    private sideIntersectPoint: Point | null = null; // 側辺との交点
    private bottomIntersectPoint: Point | null = null; // 下辺との交点

    private readonly pageWidth: number;
    private readonly pageHeight: number;

    constructor(
        private direction: FlipDirection, // フリップの方向（前または後ろ）
        private corner: FlipCorner, // 開始される角（上 or 下）
        pageWidth: string,
        pageHeight: string
    ) {
        this.pageWidth = parseInt(pageWidth, 10);
        this.pageHeight = parseInt(pageHeight, 10);
    }

    // 現在のローカル位置から角度・位置・交点を計算
    public calc(localPos: Point): boolean {
        try {
            this.position = this.calcAngleAndPosition(localPos);
            this.calculateIntersectPoint(this.position);
            return true;
        } catch (e) {
            return false;
        }
    }

    // フリップ中のページのクリップ領域を返す
    public getFlippingClipArea(): Point[] {
        const result: Point[] = [];
        let clipBottom = false;

        result.push(this.rect.topLeft);
        if (this.topIntersectPoint) result.push(this.topIntersectPoint);

        if (!this.sideIntersectPoint) {
            clipBottom = true;
        } else {
            result.push(this.sideIntersectPoint);
            if (!this.bottomIntersectPoint) clipBottom = false;
        }

        if (this.bottomIntersectPoint) result.push(this.bottomIntersectPoint);

        if (clipBottom || this.corner === FlipCorner.BOTTOM) {
            result.push(this.rect.bottomLeft);
        }

        return result;
    }

    // 裏面ページの表示クリップ領域を返す
    public getBottomClipArea(): Point[] {
        const result: Point[] = [];

        if (this.topIntersectPoint) result.push(this.topIntersectPoint);

        result.push({ x: this.pageWidth, y: 0 });
        if (this.corner !== FlipCorner.TOP) {
            result.push({ x: this.pageWidth, y: this.pageHeight });
        }

        if (this.sideIntersectPoint && this.topIntersectPoint) {
            if (
                Helper.getDistanceBetweenTwoPoints(
                    this.sideIntersectPoint,
                    this.topIntersectPoint
                ) >= 10
            ) result.push(this.sideIntersectPoint);
        } else if (this.corner === FlipCorner.TOP) {
            result.push({ x: this.pageWidth, y: this.pageHeight });
        }

        if (this.bottomIntersectPoint) result.push(this.bottomIntersectPoint);
        if (this.topIntersectPoint) result.push(this.topIntersectPoint);

        return result;
    }

    public getAngle(): number {
        return this.direction === FlipDirection.FORWARD ? -this.angle : this.angle;
    }

    public getRect(): RectPoints {
        return this.rect;
    }

    public getPosition(): Point {
        return this.position;
    }

    public getActiveCorner(): Point {
        return this.direction === FlipDirection.FORWARD ? this.rect.topLeft : this.rect.topRight;
    }

    public getDirection(): FlipDirection {
        return this.direction;
    }

    // フリップの進行度（%）を返す
    public getFlippingProgress(): number {
        return Math.abs(((this.position.x - this.pageWidth) / (2 * this.pageWidth)) * 100);
    }

    public getCorner(): FlipCorner {
        return this.corner;
    }

    // 裏面ページの描画開始点を返す
    public getBottomPagePosition(): Point {
        return this.direction === FlipDirection.BACK ? { x: this.pageWidth, y: 0 } : { x: 0, y: 0 };
    }

    // 影の描画開始点を返す
    public getShadowStartPoint(): Point {
        return this.corner === FlipCorner.TOP
            ? this.topIntersectPoint!
            : this.sideIntersectPoint ?? this.topIntersectPoint!;
    }

    // 影の描画角度（ラジアン）を返す
    public getShadowAngle(): number {
        const angle = Helper.getAngleBetweenTwoLines(this.getSegmentToShadowLine(), [
            { x: 0, y: 0 },
            { x: this.pageWidth, y: 0 },
        ]);

        return this.direction === FlipDirection.FORWARD ? angle : Math.PI - angle;
    }

    // 角度と位置、交点の更新ロジック
    private calcAngleAndPosition(pos: Point): Point {
        let result = pos;
        this.updateAngleAndGeometry(result);

        const centerLine = this.corner === FlipCorner.TOP
            ? [{ x: 0, y: 0 }, { x: 0, y: this.pageHeight }]
            : [{ x: 0, y: this.pageHeight }, { x: 0, y: 0 }];

        result = this.checkPositionAtCenterLine(result, centerLine[0], centerLine[1]);

        if (Math.abs(result.x - this.pageWidth) < 1 && Math.abs(result.y) < 1) {
            throw new Error('Point is too small');
        }

        return result;
    }

    private updateAngleAndGeometry(pos: Point): void {
        this.angle = this.calculateAngle(pos);
        this.rect = this.getPageRect(pos);
    }

    private calculateAngle(pos: Point): number {
        const left = this.pageWidth - pos.x + 1;
        const top = this.corner === FlipCorner.BOTTOM ? this.pageHeight - pos.y : pos.y;

        let angle = 2 * Math.acos(left / Math.sqrt(top * top + left * left));
        if (top < 0) angle = -angle;

        const da = Math.PI - angle;
        if (!isFinite(angle) || (da >= 0 && da < 0.003)) throw new Error('The G point is too small');
        if (this.corner === FlipCorner.BOTTOM) angle = -angle;

        return angle;
    }

    private getPageRect(localPos: Point): RectPoints {
        const basePoints = this.corner === FlipCorner.TOP
            ? [
                  { x: 0, y: 0 },
                  { x: this.pageWidth, y: 0 },
                  { x: 0, y: this.pageHeight },
                  { x: this.pageWidth, y: this.pageHeight },
              ]
            : [
                  { x: 0, y: -this.pageHeight },
                  { x: this.pageWidth, y: -this.pageHeight },
                  { x: 0, y: 0 },
                  { x: this.pageWidth, y: 0 },
              ];

        return this.getRectFromBasePoint(basePoints, localPos);
    }

    private getRectFromBasePoint(points: Point[], localPos: Point): RectPoints {
        return {
            topLeft: this.getRotatedPoint(points[0], localPos),
            topRight: this.getRotatedPoint(points[1], localPos),
            bottomLeft: this.getRotatedPoint(points[2], localPos),
            bottomRight: this.getRotatedPoint(points[3], localPos),
        };
    }

    private getRotatedPoint(transformedPoint: Point, startPoint: Point): Point {
        return Helper.getRotatedPoint(transformedPoint, startPoint, this.angle);
    }

    // 各辺との交差点を求める
    private calculateIntersectPoint(pos: Point): void {
        const boundRect: Rect = {
            left: -1,
            top: -1,
            width: this.pageWidth + 2,
            height: this.pageHeight + 2,
        };

        if (this.corner === FlipCorner.TOP) {
            this.topIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [pos, this.rect.topRight],
                [
                    { x: 0, y: 0 },
                    { x: this.pageWidth, y: 0 },
                ]
            );

            this.sideIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [pos, this.rect.bottomLeft],
                [
                    { x: this.pageWidth, y: 0 },
                    { x: this.pageWidth, y: this.pageHeight },
                ]
            );

            this.bottomIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [this.rect.bottomLeft, this.rect.bottomRight],
                [
                    { x: 0, y: this.pageHeight },
                    { x: this.pageWidth, y: this.pageHeight },
                ]
            );
        } else {
            this.topIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [this.rect.topLeft, this.rect.topRight],
                [
                    { x: 0, y: 0 },
                    { x: this.pageWidth, y: 0 },
                ]
            );

            this.sideIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [pos, this.rect.topLeft],
                [
                    { x: this.pageWidth, y: 0 },
                    { x: this.pageWidth, y: this.pageHeight },
                ]
            );

            this.bottomIntersectPoint = Helper.getIntersectBetweenTwoSegments(
                boundRect,
                [this.rect.bottomLeft, this.rect.bottomRight],
                [
                    { x: 0, y: this.pageHeight },
                    { x: this.pageWidth, y: this.pageHeight },
                ]
            );
        }
    }

    // フリップ範囲が中央線を超えないよう制限する
    private checkPositionAtCenterLine(
        checkedPos: Point,
        centerOne: Point,
        centerTwo: Point
    ): Point {
        let result = checkedPos;
        const tmp = Helper.limitPointToCircle(centerOne, this.pageWidth, result);
        if (result !== tmp) {
            result = tmp;
            this.updateAngleAndGeometry(result);
        }

        const rad = Math.sqrt(Math.pow(this.pageWidth, 2) + Math.pow(this.pageHeight, 2));
        let checkPointOne = this.rect.bottomRight;
        let checkPointTwo = this.rect.topLeft;

        if (this.corner === FlipCorner.BOTTOM) {
            checkPointOne = this.rect.topRight;
            checkPointTwo = this.rect.bottomLeft;
        }

        if (checkPointOne.x <= 0) {
            const bottomPoint = Helper.limitPointToCircle(centerTwo, rad, checkPointTwo);
            if (bottomPoint !== result) {
                result = bottomPoint;
                this.updateAngleAndGeometry(result);
            }
        }

        return result;
    }

    // 影を描くための線（セグメント）を取得
    private getSegmentToShadowLine(): Segment {
        const first = this.getShadowStartPoint();
        const second =
            first !== this.sideIntersectPoint && this.sideIntersectPoint
                ? this.sideIntersectPoint
                : this.bottomIntersectPoint!;

        return [first, second];
    }
}
