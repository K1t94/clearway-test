import {
  Component, Input, Output, ElementRef,
  inject, afterNextRender, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';

type PositionMeta = {
  x: number;
  y: number;
}

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss'],
  standalone: true,
  imports: [CommonModule],
  host: {
    '[style.--positionX]': 'positionX + "px"',
    '[style.--positionY]': 'positionY + "px"',
  }
})
export class AnnotationComponent {
  private readonly elementRef = inject(ElementRef);

  @Input({ required: true }) scale = 1;
  @Input({ required: true }) positionX = 0;
  @Input({ required: true }) positionY = 0;
  @Input({ required: true }) text = '';
  @Input({ required: true }) textColor = '';
  @Input({ required: true }) textSize = 12;
  @Input({ required: true }) backgroundColor = '';

  @Output() moved = new EventEmitter<PositionMeta>();
  @Output() deleted = new EventEmitter<void>();

  isDragging = false;
  dragStart = { x: 0, y: 0 };

  constructor() {
    afterNextRender(() => {
      this.elementRef.nativeElement.style.setProperty('--annotation-scale', this.scale.toString());
    });
  }

  startDrag(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return;
    }

    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - (this.positionX * this.scale),
      y: event.clientY - (this.positionY * this.scale)
    };

    const handleMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    const handleMouseUp = () => {
      this.onMouseUp();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const newX = (event.clientX - this.dragStart.x) / this.scale;
    const newY = (event.clientY - this.dragStart.y) / this.scale;

    this.moved.emit({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  }

  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  onDelete() {
    this.deleted.emit();
  }
}
