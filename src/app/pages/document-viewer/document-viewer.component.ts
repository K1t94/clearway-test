import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
  afterNextRender,
} from '@angular/core';
import { delay, distinctUntilChanged, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AnnotationService } from '../../services/annotation.service';
import { AnnotationComponent } from '../../components/annotation/annotation.component';
import { DocumentModel } from '../../models/document.model';
import { DataService } from '../../services/data.service';
import type { IAnnotationPosition } from '../../models/annotation.model';

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  imports: [CommonModule, AnnotationComponent],
  standalone: true,
})
export class DocumentViewerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly annotationService = inject(AnnotationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dataService = inject(DataService);

  @ViewChild('container', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  documentId = signal<string>('');
  document = signal<DocumentModel | null>(null);
  scale = signal(1);
  isAddMode = signal(false);

  private routeParams = toSignal(
    this.route.params.pipe(
      distinctUntilChanged((prev, curr) => prev['documentId'] === curr['documentId'])
    ),
    { initialValue: { documentId: '' } }
  );

  annotations = this.annotationService.getAnnotationsSignal(this.documentId);

  annotationsByPage = computed(() => {
    const doc = this.document();
    if (!doc) return [];

    return doc.pages.map((_, pageIndex) =>
      this.annotations().filter(anno => anno.position.pageIndex === pageIndex)
    );
  });

  constructor() {
    effect(() => {
      const params = this.routeParams();
      const newDocumentId = params['documentId'] || '';

      if (newDocumentId && newDocumentId !== this.documentId()) {
        this.documentId.set(newDocumentId);
        this.loadDocument(newDocumentId);

        this.scale.set(1);
        this.isAddMode.set(false);
      }
    });

    afterNextRender(() => {
      this.setupGlobalEventListeners();
    });
  }

  private loadDocument(documentId: string) {
    this.dataService.getMockData()
      .pipe(
        delay(500),
        map((response) => DocumentModel.create({
          id: documentId,
          pages: response.pages,
          title: response.name
        })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: documentModel => {
          this.document.set(documentModel);
        }
      })
  }

  private setupGlobalEventListeners() {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isAddMode()) {
        this.isAddMode.set(false);
        event.preventDefault();
      }

      if (event.ctrlKey) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          this.zoomIn();
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          this.zoomOut();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  zoomIn(): void {
    this.scale.update(s => Math.min(s + 0.25, 3));
  }

  zoomOut(): void {
    this.scale.update(s => Math.max(s - 0.25, 0.5));
  }

  toggleAddMode() {
    this.isAddMode.update(mode => !mode);
  }

  onDocumentDoubleClick(event: MouseEvent) {
    if (!this.isAddMode() || !this.document()) return;

    const container = this.containerRef.nativeElement.querySelector('.document-container') as HTMLElement;
    if (!container) return;

    let pageElement: HTMLElement | null = null;
    let pageIndex = 0;

    const pageElements = Array.from(container.querySelectorAll('.page-container'));
    for (let i = 0; i < pageElements.length; i++) {
      const pageRect = pageElements[i].getBoundingClientRect();
      if (event.clientY >= pageRect.top && event.clientY <= pageRect.bottom &&
        event.clientX >= pageRect.left && event.clientX <= pageRect.right) {
        pageElement = pageElements[i] as HTMLElement;
        pageIndex = i;
        break;
      }
    }

    if (!pageElement) {
      console.warn('Клик был вне страницы документа');
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();

    const x = (event.clientX - pageRect.left) / this.scale();
    const y = (event.clientY - pageRect.top) / this.scale();

    const text = prompt('Введите текст аннотации:', 'Новая аннотация');
    if (text) {
      this.annotationService.addAnnotation(
        this.documentId(),
        text,
        { x, y, pageIndex }
      );
    }

    this.isAddMode.set(false);
  }

  onAnnotationMoved(
    newPosition: Pick<IAnnotationPosition, 'x' | 'y'>,
    annotationId: string,
    pageIndex: number,
  ): void {
    this.annotationService.moveAnnotation(
      this.documentId(),
      annotationId,
      {
        ...newPosition,
        pageIndex,
      }
    );
  }

  onAnnotationDeleted(annotationId: string) {
    this.annotationService.deleteAnnotation(
      this.documentId(),
      annotationId
    );
  }

  saveAnnotations() {
    const doc = this.document();
    const docId = this.documentId();

    if (!doc || !docId) {
      alert('Документ не загружен');
      return;
    }

    const state = this.annotationService.saveDocumentState(docId, doc);
    alert(`Сохранено ${state.totalAnnotations} аннотаций для документа "${docId}". Проверьте консоль разработчика.`);
  }
}
