import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

// can move in four direction within our x, y coordinate system
export class Rook extends Piece {
    // will add a bool property that will detect if the instance of the piece was moved 
    // this is important since by rule if one of the rooks has been moved we cannot move it again
    private _hasMoved: boolean = false;
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    // define weather the instance of this bishop is black or white 
    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._FENChar = pieceColor === Color.White ? FENChar.WhiteRook : FENChar.BlackRook;
    }

    // defining our getter method to get the boolean (true or false)
    public get hasMoved(): boolean {
        return this._hasMoved;
    }

    // our setter method to set the boolean of the instance we are working on to true
    public set hasMoved(_) {
        this._hasMoved = true;
    }
}