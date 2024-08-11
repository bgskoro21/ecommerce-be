export class WebResponse<T> {
  statusCode: number;
  data?: T;
  message?: string;
  errors?: string;
  paging?: Paging;
}

export class Paging {
  size: number;
  total_page: number;
  current_page: number;
}
