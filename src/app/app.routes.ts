import type { Routes } from '@angular/router';
import {DocumentViewerComponent} from './pages/document-viewer/document-viewer.component';

export const routes: Routes = [
  {
    path: 'view',
    children: [
      {
        path: ":documentId",
        component: DocumentViewerComponent,
      },
    ]
  }
];
