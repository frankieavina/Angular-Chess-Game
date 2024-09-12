import { Piece } from "./pieces/piece";

// what color the pieces are 
export enum Color {
    White,
    Black
}

// using coordinate system
export type Coords = {
    x: number;
    y: number;
}

// capitalized letters are white and lowercase letters are our black pieces
export enum FENChar {
    WhitePawn = "P",
    WhiteKnight = "N",
    WhiteBishop = "B",
    WhiteRook = "R",
    WhiteQueen = "Q",
    WhiteKing = "K",
    BlackPawn = "p",
    BlackKnight = "n",
    BlackBishop = "b",
    BlackRook = "r",
    BlackQueen = "q",
    BlackKing = "k"
}


// declaring piece image path constant 
export const pieceImagePaths: Readonly<Record<FENChar, string>> = {
    [FENChar.WhitePawn]: "assets/pieces/white pawn.svg",
    [FENChar.WhiteKnight]: "assets/pieces/white knight.svg",
    [FENChar.WhiteBishop]: "assets/pieces/white bishop.svg",
    [FENChar.WhiteRook]: "assets/pieces/white rook.svg",
    [FENChar.WhiteQueen]: "assets/pieces/white queen.svg",
    [FENChar.WhiteKing]: "assets/pieces/white king.svg",
    [FENChar.BlackPawn]: "assets/pieces/black pawn.svg",
    [FENChar.BlackKnight]: "assets/pieces/black knight.svg",
    [FENChar.BlackBishop]: "assets/pieces/black bishop.svg",
    [FENChar.BlackRook]: "assets/pieces/black rook.svg",
    [FENChar.BlackQueen]: "assets/pieces/black queen.svg",
    [FENChar.BlackKing]: "assets/pieces/black king.svg"
}

// a map that for each key has a string(x + , + y) which are our initial coord for the piece and array of coordinates
export type SafeSquares = Map<string, Coords[]>;

export enum MoveType {
    Capture,
    Castling,
    Promotion,
    Check,
    CheckMate,
    BasicMove
}

export type LastMove = {
    piece: Piece;
    prevX: number;
    prevY: number;
    currX: number;
    currY: number;
    moveType: Set<MoveType>;
}

type KingChecked = {
    isInCheck: true;
    x: number;
    y: number;
}

type KingNotChecked = {
    isInCheck: false;
}

export type CheckState = KingChecked | KingNotChecked;

export type MoveList = ([string, string?])[];

export type GameHistory = {
    lastMove: LastMove | undefined;
    checkState: CheckState;
    board: (FENChar | null)[][];
}[];