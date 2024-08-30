export class UpdateStoreRequest {
  name: string;
  description?: string;
  logo?: string;
  address?: string;
}

export class StoreResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
}
