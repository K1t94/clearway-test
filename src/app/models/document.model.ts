export interface IDocumentPage {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
}

export class DocumentModel {
  static create(
    data: {
      id: string;
      title: string;
      pages: { number: number; imageUrl: string }[];
    }
  ) {
    const model = new DocumentModel();

    model.id = data.id;
    model.title = data.title;
    model.pages = data.pages.map((page) => ({
      pageNumber: page.number + 1,
      imageUrl: page.imageUrl,
      width: 800,
      height: 1131
    }));

    return model;
  }

  id = '';
  title = '';
  pages: IDocumentPage[] = []
}
