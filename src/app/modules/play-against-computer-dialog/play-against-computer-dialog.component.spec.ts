import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayAgainstComputerDialogComponent } from './play-against-computer-dialog.component';

describe('PlayAgainstComputerDialogComponent', () => {
  let component: PlayAgainstComputerDialogComponent;
  let fixture: ComponentFixture<PlayAgainstComputerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayAgainstComputerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayAgainstComputerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
