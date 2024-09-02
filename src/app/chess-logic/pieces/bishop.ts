import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

// making a Bishop class that is an extension of Piece class and apply
// the rules for Bishop. So what directions or moves it can move from its current position
// using our graph/grid system of an x and y coordinate system. So our bishop can 
// move four directions diagonally 
export class Bishop extends Piece {
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
        { x: -1, y: -1 }
    ];

    // now define the color of the bishop instance 
    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._FENChar = pieceColor === Color.White ? FENChar.WhiteBishop : FENChar.BlackBishop;
    }
}