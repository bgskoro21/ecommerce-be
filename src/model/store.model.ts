class UpdateStoreRequest {
  name: string;
  description?: string;
  logo?: string;
}

class StoreResponse {
  id: string;
  userId: string;
  name: string;
  description: string;
}
