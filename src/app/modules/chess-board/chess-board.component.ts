import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChessBoard } from '../../chess-logic/chess-board';
import { CheckState, Color, Coords, FENChar, GameHistory, LastMove, MoveList, MoveType, SafeSquares, pieceImagePaths } from '../../chess-logic/models';
import { SelectedSquare } from './models';
import { ChessBoardService } from './chess-board.service';
import { Subscription, filter, fromEvent, tap } from 'rxjs';
import { FENConverter } from '../../chess-logic/FENConverter';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})

export class ChessBoardComponent implements OnInit, OnDestroy {
  // property for the path of the image instance 
  public pieceImagePaths = pieceImagePaths;

  // instantiate our chessborad class 
  protected chessBoard = new ChessBoard();
  // declare our chessboard view
  public chessBoardView: (FENChar | null)[][] = this.chessBoard.chessBoardView;
  // declare public getter for player color 
  public get playerColor(): Color { return this.chessBoard.playerColor; };
  // declare getter for pieces safe squares
  public get safeSquares(): SafeSquares { return this.chessBoard.safeSquares; };
  public get gameOverMessage(): string | undefined { return this.chessBoard.gameOverMessage; };

  // declare our selected square to be empty
  private selectedSquare: SelectedSquare = { piece: null };
  // represent square that are safe to move to for the selected piece as an array of coord
  private pieceSafeSquares: Coords[] = [];
  // we will apply certain css class so we can identify when king is in check or when square is 
  // starting or ending for the piece that last made the move 
  private lastMove: LastMove | undefined = this.chessBoard.lastMove;
  private checkState: CheckState = this.chessBoard.checkState;

  public get moveList(): MoveList { return this.chessBoard.moveList; };
  public get gameHistory(): GameHistory { return this.chessBoard.gameHistory; };
  public gameHistoryPointer: number = 0;

  // promotion properties for Pawn
  public isPromotionActive: boolean = false;
  private promotionCoords: Coords | null = null;
  private promotedPiece: FENChar | null = null;
  public promotionPieces(): FENChar[] {
    return this.playerColor === Color.White ?
      [FENChar.WhiteKnight, FENChar.WhiteBishop, FENChar.WhiteRook, FENChar.WhiteQueen] :
      [FENChar.BlackKnight, FENChar.BlackBishop, FENChar.BlackRook, FENChar.BlackQueen];
  }

  public flipMode: boolean = false;
  private subscriptions$ = new Subscription();

  constructor(protected chessBoardService: ChessBoardService) { }

  public ngOnInit(): void {
    const keyEventSubscription$: Subscription = fromEvent<KeyboardEvent>(document, "keyup")
      .pipe(
        filter(event => event.key === "ArrowRight" || event.key === "ArrowLeft"),
        tap(event => {
          switch (event.key) {
            case "ArrowRight":
              if (this.gameHistoryPointer === this.gameHistory.length - 1) return;
              this.gameHistoryPointer++;
              break;
            case "ArrowLeft":
              if (this.gameHistoryPointer === 0) return;
              this.gameHistoryPointer--;
              break;
            default:
              break;
          }

          this.showPreviousPosition(this.gameHistoryPointer);
        })
      )
      .subscribe();

    this.subscriptions$.add(keyEventSubscription$);
  }

public ngOnDestroy(): void {
  this.subscriptions$.unsubscribe();
  this.chessBoardService.chessBoardState$.next(FENConverter.initalPosition);
}

// fn to flip chessboard 
public flipBoard(): void {
  this.flipMode = !this.flipMode;
}

// declaring our isSquareDark Method to see which square will be dark
public isSquareDark(x: number, y: number): boolean {
  return ChessBoard.isSquareDark(x, y);
}

// if x and y are the same as the selected square for css class and highlight the selected square
public isSquareSelected(x: number, y: number): boolean {
  if (!this.selectedSquare.piece) return false;
  return this.selectedSquare.x === x && this.selectedSquare.y === y;
}

//will be used together with css to pin point which square are the safe squares(TRUE) of the selected piece
public isSquareSafeForSelectedPiece(x: number, y: number): boolean {
  return this.pieceSafeSquares.some(coords => coords.x === x && coords.y === y);
}

public isSquareLastMove(x: number, y: number): boolean {
  if (!this.lastMove) return false;
  const { prevX, prevY, currX, currY } = this.lastMove;
  return x === prevX && y === prevY || x === currX && y === currY;
}

public isSquareChecked(x: number, y: number): boolean {
  return this.checkState.isInCheck && this.checkState.x === x && this.checkState.y === y;
}

// function so that will check if square is promotion square then it will add a special css styling
public isSquarePromotionSquare(x: number, y: number): boolean {
  if (!this.promotionCoords) return false;
  return this.promotionCoords.x === x && this.promotionCoords.y === y;
}

// function that takes care of unmarking the selected squares that we selected prior to moving the piece to a new square
// we do this my resetting selectedSquare property and its associated "safe squares"
private unmarkingPreviouslySlectedAndSafeSquares(): void {
  this.selectedSquare = { piece: null };
  this.pieceSafeSquares = [];

  // checking if promotion is active then reset a couple properties 
  if (this.isPromotionActive) {
    this.isPromotionActive = false;
    this.promotedPiece = null;
    this.promotionCoords = null;
  }
}

//method that marks the selected piece and and piece's safe square 
private selectingPiece(x: number, y: number): void {
  if (this.gameOverMessage !== undefined) return;
  const piece: FENChar | null = this.chessBoardView[x][y];
  // if we select empty space 
  if (!piece) return;
  // checking if we are selecting the wrong piece according to the players color
  if (this.isWrongPieceSelected(piece)) return;

  // fixing bug to fix if the same square is selected. So we check by if selected square is not null AND selected square is x AND selected square is equal to y then
  // return and dont do anything. And before that unmark previous selected safe squares as well(de-highlight safe squares)
  const isSameSquareClicked: boolean = !!this.selectedSquare.piece && this.selectedSquare.x === x && this.selectedSquare.y === y;
  this.unmarkingPreviouslySlectedAndSafeSquares();
  if (isSameSquareClicked) return;

  this.selectedSquare = { piece, x, y };
  // assign the safe squares that correspond to the instance of the piece we selected 
  this.pieceSafeSquares = this.safeSquares.get(x + "," + y) || [];
}

//placing the piece in the new square(x,y coord)
private placingPiece(newX: number, newY: number): void {
  // if square is empty or square can be placed there exit fn as you cant place the piece 
  if (!this.selectedSquare.piece) return;
  if (!this.isSquareSafeForSelectedPiece(newX, newY)) return;

  // pawn promotion
  const isPawnSelected: boolean = this.selectedSquare.piece === FENChar.WhitePawn || this.selectedSquare.piece === FENChar.BlackPawn;
  const isPawnOnlastRank: boolean = isPawnSelected && (newX === 7 || newX === 0);
  const shouldOpenPromotionDialog: boolean = !this.isPromotionActive && isPawnOnlastRank;

  // pawn promotion dialog 
  if (shouldOpenPromotionDialog) {
    this.pieceSafeSquares = [];
    this.isPromotionActive = true;
    this.promotionCoords = { x: newX, y: newY };
    // because now we wait for player to choose promoted piece
    return;
  }

  // descructuring prevx and prevY from selected square and update piece to its new position in the board
  const { x: prevX, y: prevY } = this.selectedSquare;
  this.updateBoard(prevX, prevY, newX, newY, this.promotedPiece);
}

// this just updates the board and removes the piece where the update happens 
protected updateBoard(prevX: number, prevY: number, newX: number, newY: number, promotedPiece: FENChar | null): void {
  this.chessBoard.move(prevX, prevY, newX, newY, promotedPiece);
  this.chessBoardView = this.chessBoard.chessBoardView;
  this.markLastMoveAndCheckState(this.chessBoard.lastMove, this.chessBoard.checkState);
  // reset selected square as piece was moved  
  this.unmarkingPreviouslySlectedAndSafeSquares();
  this.chessBoardService.chessBoardState$.next(this.chessBoard.boardAsFEN);
  this.gameHistoryPointer++;
}

// fising bug so when i click on a promotion piece it will place that piece on the board 
// and also when i click on another piece the dialog still remain open 
public promotePiece(piece: FENChar): void {
  if (!this.promotionCoords || !this.selectedSquare.piece) return;
  this.promotedPiece = piece;
  const { x: newX, y: newY } = this.promotionCoords;
  const { x: prevX, y: prevY } = this.selectedSquare;
  this.updateBoard(prevX, prevY, newX, newY, this.promotedPiece);
}


// just closing the dialog "box"
public closePawnPromotionDialog(): void {
  this.unmarkingPreviouslySlectedAndSafeSquares();
}

private markLastMoveAndCheckState(lastMove: LastMove | undefined, checkState: CheckState): void {
  this.lastMove = lastMove;
  this.checkState = checkState;

  if (this.lastMove)
    this.moveSound(this.lastMove.moveType);
  else
    this.moveSound(new Set<MoveType>([MoveType.BasicMove]));
}
public move(x: number, y: number): void {
  this.selectingPiece(x, y);
  this.placingPiece(x, y);
}

// Method that prevents selecting pieces of a player who is not playing or whos turn is not up yet
// we do this by checking the upper and lowercase letters. Upper is white lowercase is black
private isWrongPieceSelected(piece: FENChar): boolean {
  const isWhitePieceSelected: boolean = piece === piece.toUpperCase();
  return isWhitePieceSelected && this.playerColor === Color.Black ||
    !isWhitePieceSelected && this.playerColor === Color.White;
}

public showPreviousPosition(moveIndex: number): void {
  const { board, checkState, lastMove } = this.gameHistory[moveIndex];
  this.chessBoardView = board;
  this.markLastMoveAndCheckState(lastMove, checkState);
  this.gameHistoryPointer = moveIndex;
}

private moveSound(moveType: Set<MoveType>): void {
  const moveSound = new Audio("assets/sound/move.mp3");

  if (moveType.has(MoveType.Promotion)) moveSound.src = "assets/sound/promote.mp3";
  else if (moveType.has(MoveType.Capture)) moveSound.src = "assets/sound/capture.mp3";
  else if (moveType.has(MoveType.Castling)) moveSound.src = "assets/sound/castling.mp3";

  if (moveType.has(MoveType.CheckMate)) moveSound.src = "assets/sound/checkmate.mp3";
  else if (moveType.has(MoveType.Check)) moveSound.src = "assets/sound/check.mp3";

  moveSound.play();
}
}