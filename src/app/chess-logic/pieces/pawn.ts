import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

// can move in four directions 
export class Pawn extends Piece {
    private _hasMoved: boolean = false;
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: -1 }
    ];

    constructor(private pieceColor: Color) {
        super(pieceColor);
        // if instance is black call method and change x direction 
        if (pieceColor === Color.Black) this.setBlackPawnDirections();
        this._FENChar = pieceColor === Color.White ? FENChar.WhitePawn : FENChar.BlackPawn;
    }

    // if the instance of the the pawn is black we have to change the directions
    // all we have to do is change the x property by multiplying it by -1
    private setBlackPawnDirections(): void {
        this._directions = this._directions.map(({ x, y }) => ({ x: -1 * x, y }));
    }

    // check if our pawn has moved 
    public get hasMoved(): boolean {
        return this._hasMoved;
    }

    // after the pawn piece has moved it is allowed to move in 3 directions
    public set hasMoved(_) {
        this._hasMoved = true;
        this._directions = [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: -1 }
        ];
        // if pawn is black adjust the x direction
        if (this.pieceColor === Color.Black) this.setBlackPawnDirections();
    }
}