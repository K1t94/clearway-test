import { Injectable, type Signal } from '@angular/core';
import {BehaviorSubject, distinctUntilChanged, shareReplay} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import {AnnotationModel, type IAnnotationPosition} from '../models/annotation.model';
import {DocumentModel} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  private readonly _annotationsSubjects = new Map<string, BehaviorSubject<AnnotationModel[]>>();

  getAnnotations$(documentId: string) {
    return this.getOrCreateSubject(documentId).asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getAnnotationsSignal(documentIdSignal: Signal<string>) {
    const documentId$ = toObservable(documentIdSignal);

    const annotations$ = documentId$.pipe(
      distinctUntilChanged(),
      switchMap(docId => this.getAnnotations$(docId))
    );

    return toSignal(annotations$, { initialValue: [] });
  }

  addAnnotation(documentId: string, text: string, position: IAnnotationPosition) {
    const annotation = AnnotationModel.create(
      {
        text,
        position,
        style: {
          color: '#000000',
          backgroundColor: '#FFFF00',
          fontSize: 14
        }
      }
    );

    const subject = this.getOrCreateSubject(documentId);
    const currentAnnotations = subject.getValue();
    subject.next([...currentAnnotations, annotation]);

    return annotation;
  }

  updateAnnotation(documentId: string, annotationId: string, updates: Partial<AnnotationModel>) {
    const subject = this.getOrCreateSubject(documentId);
    const currentAnnotations = subject.getValue();

    const updatedAnnotations = currentAnnotations.map(anno =>
      anno.id === annotationId
        ? { ...anno, ...updates, id: anno.id, createdAt: anno.createdAt }
        : anno
    );

    subject.next(updatedAnnotations);
  }

  deleteAnnotation(documentId: string, annotationId: string) {
    const subject = this.getOrCreateSubject(documentId);
    const currentAnnotations = subject.getValue();
    subject.next(currentAnnotations.filter(anno => anno.id !== annotationId));
  }

  moveAnnotation(documentId: string, annotationId: string, newPosition: IAnnotationPosition) {
    this.updateAnnotation(documentId, annotationId, { position: newPosition });
  }

  saveDocumentState(documentId: string, document: DocumentModel) {
    const subject = this.getOrCreateSubject(documentId);
    const annotations = subject.getValue();

    const state = {
      documentId,
      document,
      annotations: annotations.map(anno => ({
        ...anno,
        createdAt: anno.createdAt,
      })),
      savedAt: new Date().toISOString(),
      totalAnnotations: annotations.length
    };

    console.log('Сохраненное состояние:', JSON.stringify(state, null, 2));
    return state;
  }

  private getOrCreateSubject(documentId: string) {
    if (!this._annotationsSubjects.has(documentId)) {
      this._annotationsSubjects.set(documentId, new BehaviorSubject<AnnotationModel[]>([]));
    }
    return this._annotationsSubjects.get(documentId)!;
  }
}
