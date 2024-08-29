export class UpdateStoreRequest {
  name: string;
  description?: string;
  logo?: string;
}

export class StoreResponse {
  id: string;
  userId: string;
  name: string;
  description: string;
}
