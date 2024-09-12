import { columns } from "../modules/chess-board/models";
import { FENConverter } from "./FENConverter";
import { CheckState, Color, Coords, FENChar, GameHistory, LastMove, MoveList, MoveType, SafeSquares } from "./models";
import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { Piece } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";

// chessboard is 2 dimensional matrix of pieces 
export class ChessBoard {
    private chessBoard: (Piece | null)[][];
    // hard code the size of the chess board
    private readonly chessBoardSize: number = 8;
    private _playerColor = Color.White;
    // property that saves our pieces safe square 
    private _safeSquares: SafeSquares;
    private _lastMove: LastMove | undefined;
    // state of king being checked or not. initally king isInCheck is set to false
    private _checkState: CheckState = { isInCheck: false };
    // counter to keep track of the 50 move rule
    private fiftyMoveRuleCounter: number = 0;

    private _isGameOver: boolean = false;
    private _gameOverMessage: string | undefined;

    private fullNumberOfMoves: number = 1;
    // properties that will keep track of 3 fold repetition 
    private threeFoldRepetitionDictionary = new Map<string, number>();
    private threeFoldRepetitionFlag: boolean = false;

    // we need some property that holds board's position as a f-string just in case of a 3 fold repetition
    private _boardAsFEN: string = FENConverter.initalPosition;
    private FENConverter = new FENConverter();

    private _moveList: MoveList = [];
    private _gameHistory: GameHistory;

  

    constructor() {
        // Laying the outline of our chessboard in our 2 dimensional matrix of black and white pieces
        this.chessBoard = [
            [
                new Rook(Color.White), new Knight(Color.White), new Bishop(Color.White), new Queen(Color.White),
                new King(Color.White), new Bishop(Color.White), new Knight(Color.White), new Rook(Color.White)
            ],
            [
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White),
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White)
            ],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black),
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black)
            ],
            [
                new Rook(Color.Black), new Knight(Color.Black), new Bishop(Color.Black), new Queen(Color.Black),
                new King(Color.Black), new Bishop(Color.Black), new Knight(Color.Black), new Rook(Color.Black)
            ],
        ];
        // constructor for our safe squares of the selected piece 
        this._safeSquares = this.findSafeSqures();
        this._gameHistory = [{ board: this.chessBoardView, lastMove: this._lastMove, checkState: this._checkState }];
    }

    // getting color of our player for this instance 
    public get playerColor(): Color {
        return this._playerColor;
    }

    // getting the view of the chessboard
    public get chessBoardView(): (FENChar | null)[][] {
        // looping through our chessboard and for each row we are checking if the squares
        // have a piece or are empty 
        return this.chessBoard.map(row => {
            // if there is a piece then we need to return its FEN representation  
            return row.map(piece => piece instanceof Piece ? piece.FENChar : null);
        })
    }

    // only need a getter fn for safe squares of our selected piece  
    public get safeSquares(): SafeSquares {
        return this._safeSquares;
    }

    // getter for last move property 
    public get lastMove(): LastMove | undefined {
        return this._lastMove;
    }

    public get checkState(): CheckState {
        return this._checkState;
    }

    public get isGameOver(): boolean {
        return this._isGameOver;
    }

    public get gameOverMessage(): string | undefined {
        return this._gameOverMessage;
    }

    public get boardAsFEN(): string {
        return this._boardAsFEN;
    }

    public get moveList(): MoveList {
        return this._moveList;
    }

    public get gameHistory(): GameHistory {
        return this._gameHistory;
    }

    // logic to determine if square is dark(black)
    // if both x AND y coordinates are even OR if both x AND y coordinates are odd 
    public static isSquareDark(x: number, y: number): boolean {
        return x % 2 === 0 && y % 2 === 0 || x % 2 === 1 && y % 2 === 1;
    }

    // method that checks weather the newly created coordinates are valid 
    private areCoordsValid(x: number, y: number): boolean {
        // for them to be valid x AND y have to be greater then or equal 0 AND x AND y 
        // coordinates have to be smaller then the chessboard size (8)
        return x >= 0 && y >= 0 && x < this.chessBoardSize && y < this.chessBoardSize;
    }

    public isInCheck(playerColor: Color, checkingCurrentPosition: boolean): boolean {
        // see if position is in check by looping through the chessboard 
        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                // checking if each square is empty or has a piece 
                const piece: Piece | null = this.chessBoard[x][y];
                // if piece is empty or the piece color is the same as the player's color continue
                if (!piece || piece.color === playerColor) continue;

                // now traverse through all the the piece's directions
                for (const { x: dx, y: dy } of piece.directions) {
                    // make new x and y coordinates 
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    // if new coordinates are not valid continue 
                    if (!this.areCoordsValid(newX, newY)) continue;

                    // if the piece is pawn, knight , or king its an attack piece 
                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        // just checking if its a pawn and dy is 0 because pawns can only attack diagonally
                        if (piece instanceof Pawn && dy === 0) continue;

                        // attacked piece is assigned new x and y coord
                        const attackedPiece: Piece | null = this.chessBoard[newX][newY];
                        // if piece is a king AND the color is the same as the players color 
                        if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                            // checking if king is checked 
                            if (checkingCurrentPosition) this._checkState = { isInCheck: true, x: newX, y: newY };
                            return true;
                        }
                    }
                    // if piece are bishops , queens , rooks they can move along multiple squares in one direction 
                    else {
                        // traverse all the possible squares along each direction
                        while (this.areCoordsValid(newX, newY)) {
                            const attackedPiece: Piece | null = this.chessBoard[newX][newY];
                            if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                                // checking if any of the 3 pieces are in check 
                                if (checkingCurrentPosition) this._checkState = { isInCheck: true, x: newX, y: newY };
                                return true;
                            }

                            // stop traversing along this direction because we reached a certain piece
                            // bishops etc. cant move over pieces
                            if (attackedPiece !== null) break;

                            // update new x and new y coord
                            newX += dx;
                            newY += dy;
                        }
                    }
                }
            }
        }
        // if king is not in check update status to false 
        if (checkingCurrentPosition) this._checkState = { isInCheck: false };
        // if position is not in check
        return false;
    }

    // method that is checking is the position is save after the move 
    private isPositionSafeAfterMove(prevX: number, prevY: number, newX: number, newY: number): boolean {
        const piece: Piece | null = this.chessBoard[prevX][prevY];
        if (!piece) return false;

        const newPiece: Piece | null = this.chessBoard[newX][newY];
        // we cant put piece on a square that already contains piece of the same square
        if (newPiece && newPiece.color === piece.color) return false;

        // simulate position
        this.chessBoard[prevX][prevY] = null;
        this.chessBoard[newX][newY] = piece;

        // position is safe if that player is not in check after moving the piece 
        const isPositionSafe: boolean = !this.isInCheck(piece.color, false);

        // restore position back
        this.chessBoard[prevX][prevY] = piece;
        this.chessBoard[newX][newY] = newPiece;

        return isPositionSafe;
    }

    private findSafeSqures(): SafeSquares {
        const safeSqures: SafeSquares = new Map<string, Coords[]>();

        // using for loop to traverse through the board to find the "safe squares"
        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];
                // if square is empty OR piece color is the same as player's color 
                if (!piece || piece.color !== this._playerColor) continue;

                // initialize our pieceSafeSquares to an empty array
                const pieceSafeSquares: Coords[] = [];

                // look toward all of the pieces direction 
                for (const { x: dx, y: dy } of piece.directions) {
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    if (!this.areCoordsValid(newX, newY)) continue;

                    // create new instance and check if the new piece has the same color as piece then we cant proceed
                    let newPiece: Piece | null = this.chessBoard[newX][newY];
                    if (newPiece && newPiece.color === piece.color) continue;

                    // need to restrict pawn moves in certain directions
                    if (piece instanceof Pawn) {
                        // cant move pawn two squares straight if there is piece in front of pawn
                        if (dx === 2 || dx === -2) {
                            if (newPiece) continue;
                            if (this.chessBoard[newX + (dx === 2 ? -1 : 1)][newY]) continue;
                        }

                        // cant move pawn one square straight if piece is in front of him
                        if ((dx === 1 || dx === -1) && dy === 0 && newPiece) continue;

                        // cant move pawn diagonally if there is no piece, or piece has same color as pawn
                        if ((dy === 1 || dy === -1) && (!newPiece || piece.color === newPiece.color)) continue;
                    }

                    // append new coordinates if position is safe 
                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        if (this.isPositionSafeAfterMove(x, y, newX, newY))
                            pieceSafeSquares.push({ x: newX, y: newY });
                    }
                    else {
                        // now check queen etc. hence why we use while loop since we can move along one direction and multiple squares
                        while (this.areCoordsValid(newX, newY)) {
                            newPiece = this.chessBoard[newX][newY];
                            if (newPiece && newPiece.color === piece.color) break;

                            if (this.isPositionSafeAfterMove(x, y, newX, newY))
                                pieceSafeSquares.push({ x: newX, y: newY });

                            if (newPiece !== null) break;

                            // increment new x and y coordinate
                            newX += dx;
                            newY += dy;
                        }
                    }
                }

                // need to check for both king and queen side castling 
                if (piece instanceof King) {
                    if (this.canCastle(piece, true))
                        pieceSafeSquares.push({ x, y: 6 });

                    if (this.canCastle(piece, false))
                        pieceSafeSquares.push({ x, y: 2 });
                }
                else if (piece instanceof Pawn && this.canCaptureEnPassant(piece, x, y))
                    pieceSafeSquares.push({ x: x + (piece.color === Color.White ? 1 : -1), y: this._lastMove!.prevY });

                // after we trasverse through all the spaces if there if any 'safe squares' add them to 
                // our pieceSafeSquares array
                if (pieceSafeSquares.length)
                    safeSqures.set(x + "," + y, pieceSafeSquares);
            }
        }

        return safeSqures;
    }

    // implementing EnPassant move. Conditions for EnPassant:
    // 1. Previous player moved pawn two squares
    // 2. our pawn and opponents pawn are on the same level
    // 3. the pawns are adjacent ot each other 
    // 4. position must be safe after capture is completed 
    private canCaptureEnPassant(pawn: Pawn, pawnX: number, pawnY: number): boolean {
        if (!this._lastMove) return false;
        const { piece, prevX, prevY, currX, currY } = this._lastMove;

        if (
            !(piece instanceof Pawn) ||
            pawn.color !== this._playerColor ||
            Math.abs(currX - prevX) !== 2 ||
            pawnX !== currX ||
            Math.abs(pawnY - currY) !== 1
        ) return false;

        const pawnNewPositionX: number = pawnX + (pawn.color === Color.White ? 1 : -1);
        const pawnNewPositionY: number = currY;

        this.chessBoard[currX][currY] = null;
        const isPositionSafe: boolean = this.isPositionSafeAfterMove(pawnX, pawnY, pawnNewPositionX, pawnNewPositionY);
        this.chessBoard[currX][currY] = piece;

        return isPositionSafe;
    }

    private canCastle(king: King, kingSideCastle: boolean): boolean {
        if (king.hasMoved) return false;

        const kingPositionX: number = king.color === Color.White ? 0 : 7;
        const kingPositionY: number = 4;
        const rookPositionX: number = kingPositionX;
        const rookPositionY: number = kingSideCastle ? 7 : 0;
        const rook: Piece | null = this.chessBoard[rookPositionX][rookPositionY];

        if (!(rook instanceof Rook) || rook.hasMoved || this._checkState.isInCheck) return false;

        const firstNextKingPositionY: number = kingPositionY + (kingSideCastle ? 1 : -1);
        const secondNextKingPositionY: number = kingPositionY + (kingSideCastle ? 2 : -2);

        if (this.chessBoard[kingPositionX][firstNextKingPositionY] || this.chessBoard[kingPositionX][secondNextKingPositionY]) return false;

        if (!kingSideCastle && this.chessBoard[kingPositionX][1]) return false;



        return this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, firstNextKingPositionY) &&
            this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, secondNextKingPositionY);
    }

    // implementing method for moving pieces 
    public move(prevX: number, prevY: number, newX: number, newY: number, promotedPieceType: FENChar | null): void {
        if (this._isGameOver) throw new Error("Game is over, you cant play move");

        if (!this.areCoordsValid(prevX, prevY) || !this.areCoordsValid(newX, newY)) return;
        const piece: Piece | null = this.chessBoard[prevX][prevY];
        // we are checking if piece is an empty square or if the piece is the same color as the player if not exit
        if (!piece || piece.color !== this._playerColor) return;

        const pieceSafeSquares: Coords[] | undefined = this._safeSquares.get(prevX + "," + prevY);
        if (!pieceSafeSquares || !pieceSafeSquares.find(coords => coords.x === newX && coords.y === newY))
            throw new Error("Square is not safe");

        // if its a pawn, king, or rook set moved to true as it can only move once 
        if ((piece instanceof Pawn || piece instanceof King || piece instanceof Rook) && !piece.hasMoved)
            piece.hasMoved = true;

        const moveType = new Set<MoveType>();

        const isPieceTaken: boolean = this.chessBoard[newX][newY] !== null;
        if (isPieceTaken) moveType.add(MoveType.Capture);

        // if piecetaken is true then reset counter to 0 otherwise increment counter to keep track of the 50 move rule
        if (piece instanceof Pawn || isPieceTaken) this.fiftyMoveRuleCounter = 0;
        else this.fiftyMoveRuleCounter += 0.5;

        this.handlingSpecialMoves(piece, prevX, prevY, newX, newY, moveType);
        // update the board because pawn is being promoted 
        if (promotedPieceType) {
            this.chessBoard[newX][newY] = this.promotedPiece(promotedPieceType);
            moveType.add(MoveType.Promotion);
        } else {
            this.chessBoard[newX][newY] = piece;
        }

        this.chessBoard[prevX][prevY] = null;

        this._lastMove = { prevX, prevY, currX: newX, currY: newY, piece, moveType };
        // updating the color of the player after turn is over
        this._playerColor = this._playerColor === Color.White ? Color.Black : Color.White;
        this.isInCheck(this._playerColor, true);
        const safeSquares: SafeSquares = this.findSafeSqures();

        if (this._checkState.isInCheck)
            moveType.add(!safeSquares.size ? MoveType.CheckMate : MoveType.Check);
        else if (!moveType.size)
            moveType.add(MoveType.BasicMove);

        this.storeMove(promotedPieceType);
        this.updateGameHistory();

        this._safeSquares = safeSquares;
        if (this._playerColor === Color.White) this.fullNumberOfMoves++;
        this._boardAsFEN = this.FENConverter.convertBoardToFEN(this.chessBoard, this._playerColor, this._lastMove, this.fiftyMoveRuleCounter, this.fullNumberOfMoves);
        this.updateThreeFoldRepetitionDictionary(this._boardAsFEN);


        this._isGameOver = this.isGameFinished();
    }

    // handling special move for king and pawns 
    private handlingSpecialMoves(piece: Piece, prevX: number, prevY: number, newX: number, newY: number, moveType: Set<MoveType>): void {
        if (piece instanceof King && Math.abs(newY - prevY) === 2) {
            // newY > prevY  === king side castle

            const rookPositionX: number = prevX;
            const rookPositionY: number = newY > prevY ? 7 : 0;
            const rook = this.chessBoard[rookPositionX][rookPositionY] as Rook;
            const rookNewPositionY: number = newY > prevY ? 5 : 3;
            this.chessBoard[rookPositionX][rookPositionY] = null;
            this.chessBoard[rookPositionX][rookNewPositionY] = rook;
            rook.hasMoved = true;
            moveType.add(MoveType.Castling);
        }
        // fixing bug where if a pawn captures EnPassant it removes the opponent pawn 
        else if (
            piece instanceof Pawn &&
            this._lastMove &&
            this._lastMove.piece instanceof Pawn &&
            Math.abs(this._lastMove.currX - this._lastMove.prevX) === 2 &&
            prevX === this._lastMove.currX &&
            newY === this._lastMove.currY
        ) {
            this.chessBoard[this._lastMove.currX][this._lastMove.currY] = null;
            moveType.add(MoveType.Capture);
        }
    }

    // implementing pawn promotion
    private promotedPiece(promtoedPieceType: FENChar): Knight | Bishop | Rook | Queen {
        if (promtoedPieceType === FENChar.WhiteKnight || promtoedPieceType === FENChar.BlackKnight)
            return new Knight(this._playerColor);

        if (promtoedPieceType === FENChar.WhiteBishop || promtoedPieceType === FENChar.BlackBishop)
            return new Bishop(this._playerColor);

        if (promtoedPieceType === FENChar.WhiteRook || promtoedPieceType === FENChar.BlackRook)
            return new Rook(this._playerColor);

        return new Queen(this._playerColor);
    }

    // functions that checks if the game is over 
    private isGameFinished(): boolean {
        if (this.insufficientMaterial()) {
            this._gameOverMessage = "Draw due insufficient material";
            return true;
        }

        // if player doesnt have any safe squares means game is over
        // and then check weather is was a checkmate or stalemate 
        if (!this._safeSquares.size) {
            if (this._checkState.isInCheck) {
                const prevPlayer: string = this._playerColor === Color.White ? "Black" : "White";
                this._gameOverMessage = prevPlayer + " won by checkmate";
            }
            else this._gameOverMessage = "Stalemate";

            return true;
        }

        // if 3 fold repetition flag is raised ( true ) then end game in a draw and throw message
        if (this.threeFoldRepetitionFlag) {
            this._gameOverMessage = "Draw due three fold repetition rule";
            return true;
        }

        // game end since it reached the 50 moves 
        if (this.fiftyMoveRuleCounter === 50) {
            this._gameOverMessage = "Draw due fifty move rule";
            return true;
        }

        return false;
    }

    // Insufficient material

    private playerHasOnlyTwoKnightsAndKing(pieces: { piece: Piece, x: number, y: number }[]): boolean {
        return pieces.filter(piece => piece.piece instanceof Knight).length === 2;
    }

    private playerHasOnlyBishopsWithSameColorAndKing(pieces: { piece: Piece, x: number, y: number }[]): boolean {
        const bishops = pieces.filter(piece => piece.piece instanceof Bishop);
        const areAllBishopsOfSameColor = new Set(bishops.map(bishop => ChessBoard.isSquareDark(bishop.x, bishop.y))).size === 1;
        return bishops.length === pieces.length - 1 && areAllBishopsOfSameColor;
    }

    // ways we can have insufficient material position:
    // 1. king vs king 
    // 2. king and minor vs king
    // 3. 2 knights and king vs king
    // 4. both sides have exactly one same colored bishop 
    // 5. multiple bishops of same color and king vs king  
    private insufficientMaterial(): boolean {
        const whitePieces: { piece: Piece, x: number, y: number }[] = [];
        const blackPieces: { piece: Piece, x: number, y: number }[] = [];

        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];
                if (!piece) continue;

                if (piece.color === Color.White) whitePieces.push({ piece, x, y });
                else blackPieces.push({ piece, x, y });
            }
        }

        // King vs King
        if (whitePieces.length === 1 && blackPieces.length === 1)
            return true;

        // King and Minor Piece vs King
        if (whitePieces.length === 1 && blackPieces.length === 2)
            return blackPieces.some(piece => piece.piece instanceof Knight || piece.piece instanceof Bishop);

        else if (whitePieces.length === 2 && blackPieces.length === 1)
            return whitePieces.some(piece => piece.piece instanceof Knight || piece.piece instanceof Bishop);

        // both sides have bishop of same color
        else if (whitePieces.length === 2 && blackPieces.length === 2) {
            const whiteBishop = whitePieces.find(piece => piece.piece instanceof Bishop);
            const blackBishop = blackPieces.find(piece => piece.piece instanceof Bishop);

            if (whiteBishop && blackBishop) {
                const areBishopsOfSameColor: boolean = ChessBoard.isSquareDark(whiteBishop.x, whiteBishop.y) && ChessBoard.isSquareDark(blackBishop.x, blackBishop.y) || !ChessBoard.isSquareDark(whiteBishop.x, whiteBishop.y) && !ChessBoard.isSquareDark(blackBishop.x, blackBishop.y);

                return areBishopsOfSameColor;
            }
        }

        if (whitePieces.length === 3 && blackPieces.length === 1 && this.playerHasOnlyTwoKnightsAndKing(whitePieces) ||
            whitePieces.length === 1 && blackPieces.length === 3 && this.playerHasOnlyTwoKnightsAndKing(blackPieces)
        ) return true;

        if (whitePieces.length >= 3 && blackPieces.length === 1 && this.playerHasOnlyBishopsWithSameColorAndKing(whitePieces) ||
            whitePieces.length === 1 && blackPieces.length >= 3 && this.playerHasOnlyBishopsWithSameColorAndKing(blackPieces)
        ) return true;

        return false;
    }

    // method that detects if the same position occurred 3 times (Threefold repetition rule)
    private updateThreeFoldRepetitionDictionary(FEN: string): void {
        // represents first 4 parts of the FEN string because if they are the same that means they are repeated 
        const threeFoldRepetitionFENKey: string = FEN.split(" ").slice(0, 4).join("");
        // now we need to see if the key is actually in map "threeFoldRepetitionDictionary"
        const threeFoldRepetionValue: number | undefined = this.threeFoldRepetitionDictionary.get(threeFoldRepetitionFENKey);

        // if its undefined then that means this position hasnt occurred so we update the dictionary with the key and number of occurrences
        if (threeFoldRepetionValue === undefined)
            this.threeFoldRepetitionDictionary.set(threeFoldRepetitionFENKey, 1);
        else {
            // here we are stating the key have already occured more then once. If it has occurred already 3 times raise the 3 fold rep Flag
            // otherwise it has only occurred twice so add the key and number 2 representing the number of occurrences. 
            if (threeFoldRepetionValue === 2) {
                this.threeFoldRepetitionFlag = true;
                return;
            }
            this.threeFoldRepetitionDictionary.set(threeFoldRepetitionFENKey, 2);
        }
    }

    private storeMove(promotedPiece: FENChar | null): void {
        const { piece, currX, currY, prevX, prevY, moveType } = this._lastMove!;
        let pieceName: string = !(piece instanceof Pawn) ? piece.FENChar.toUpperCase() : "";
        let move: string;

        if (moveType.has(MoveType.Castling))
            move = currY - prevY === 2 ? "O-O" : "O-O-O";
        else {
            move = pieceName + this.startingPieceCoordsNotation();
            if (moveType.has(MoveType.Capture))
                move += (piece instanceof Pawn) ? columns[prevY] + "x" : "x";
            move += columns[currY] + String(currX + 1);

            if (promotedPiece)
                move += "=" + promotedPiece.toUpperCase();
        }

        if (moveType.has(MoveType.Check)) move += "+";
        else if (moveType.has(MoveType.CheckMate)) move += "#";

        if (!this._moveList[this.fullNumberOfMoves - 1])
            this._moveList[this.fullNumberOfMoves - 1] = [move];
        else
            this._moveList[this.fullNumberOfMoves - 1].push(move);
    }

    private startingPieceCoordsNotation(): string {
        const { piece: currPiece, prevX, prevY, currX, currY } = this._lastMove!;
        if (currPiece instanceof Pawn || currPiece instanceof King) return "";

        const samePiecesCoords: Coords[] = [{ x: prevX, y: prevY }];

        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];
                if (!piece || (currX === x && currY === y)) continue;

                if (piece.FENChar === currPiece.FENChar) {
                    const safeSquares: Coords[] = this._safeSquares.get(x + "," + y) || [];
                    const pieceHasSameTargetSquare: boolean = safeSquares.some(coords => coords.x === currX && coords.y === currY);
                    if (pieceHasSameTargetSquare) samePiecesCoords.push({ x, y });
                }
            }
        }

        if (samePiecesCoords.length === 1) return "";

        const piecesFile = new Set(samePiecesCoords.map(coords => coords.y));
        const piecesRank = new Set(samePiecesCoords.map(coords => coords.x));

        // means that all of the pieces are on different files (a, b, c, ...)
        if (piecesFile.size === samePiecesCoords.length)
            return columns[prevY];

        // means that all of the pieces are on different rank (1, 2, 3, ...)
        if (piecesRank.size === samePiecesCoords.length)
            return String(prevX + 1);

        // in case that there are pieces that shares both rank and a file with multiple or one piece
        return columns[prevY] + String(prevX + 1);
    }

    private updateGameHistory(): void {
        this._gameHistory.push({
            board: [...this.chessBoardView.map(row => [...row])],
            checkState: { ...this._checkState },
            lastMove: this._lastMove ? { ...this._lastMove } : undefined
        });
    }
}