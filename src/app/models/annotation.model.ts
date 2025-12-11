import { v4 as uuidv4 } from 'uuid';

export interface IAnnotationPosition {
  x: number;
  y: number;
  pageIndex: number;
}

export interface IAnnotationStyle {
  color: string;
  backgroundColor: string;
  fontSize: number;
}

const DEFAULT_POSITION = {
  x: 0,
  y: 0,
  pageIndex: 0,
}

const DEFAULT_STYLE = {
  color: 'white',
  backgroundColor: 'white',
  fontSize: 12,
}

export class AnnotationModel {
  static create(
    data: {
      id?: string,
      text: string,
      createdAt?: string,
      position?: IAnnotationPosition,
      style?: IAnnotationStyle,
    }
  ) {
    const model = new AnnotationModel();

    model.id = data?.id ?? uuidv4();
    model.createdAt = data?.createdAt ?? new Date().toISOString();
    model.position = data?.position ?? DEFAULT_POSITION;
    model.style = data?.style ?? DEFAULT_STYLE;
    model.text = data.text;

    return model;
  }

  id = uuidv4();
  text = '';
  createdAt = new Date().toISOString();
  style: IAnnotationStyle = DEFAULT_STYLE;
  position: IAnnotationPosition = DEFAULT_POSITION
}
