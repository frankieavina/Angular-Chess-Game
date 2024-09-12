import { FENChar } from "../../chess-logic/models";

// we are defining what a square can be : 1.square with a piece 2.without a piece  
type SquareWithPiece = {
    piece: FENChar;
    x: number;
    y: number;
}

type SquareWithoutPiece = {
    piece: null;
}

export type SelectedSquare = SquareWithPiece | SquareWithoutPiece;

export const columns = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;