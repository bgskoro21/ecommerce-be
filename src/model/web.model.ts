export class WebResponse<T> {
  statusCode: number;
  data?: T;
  errors?: string;
  paging?: Paging;
}

export class Paging {
  size: number;
  total_page: number;
  current_page: number;
}
