import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComputerModeComponent } from './computer-mode.component';

describe('ComputerModeComponent', () => {
  let component: ComputerModeComponent;
  let fixture: ComponentFixture<ComputerModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputerModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComputerModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
