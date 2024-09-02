import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

// defining knight moves in an x y coordinate system
export class Knight extends Piece {
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 2 },
        { x: 1, y: -2 },
        { x: -1, y: 2 },
        { x: -1, y: -2 },
        { x: 2, y: 1 },
        { x: 2, y: -1 },
        { x: -2, y: 1 },
        { x: -2, y: -1 }
    ];

    // specify color of the knight instance 
    constructor(private pieceColor: Color) {
        // calling the super constructor
        super(pieceColor);
        // implement FENChar property depending on the piece color 
        this._FENChar = pieceColor === Color.White ? FENChar.WhiteKnight : FENChar.BlackKnight;
    }
}