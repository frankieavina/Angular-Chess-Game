import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

// king piece can move in 8 directions (same as queen)
export class King extends Piece {
    // same as rook has to be checked to make sure it hasnt been moved 
    private _hasMoved: boolean = false;
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: -1, y: -1 }
    ];

    // specify king color (black or white)
    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._FENChar = pieceColor === Color.White ? FENChar.WhiteKing : FENChar.BlackKing;
    }

    //check if the instance of the king has been moved
    public get hasMoved(): boolean {
        return this._hasMoved;
    }

    // set the instance of the king to is has moved (true)
    public set hasMoved(_) {
        this._hasMoved = true;
    }
}