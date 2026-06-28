export type Restaurant = {
  id: string;
  name: string;
  address?: string;
  category?: string;
  categoryGroup?: string;
  subcategory?: string;
  tags?: string[];
  district?: string;
  businessArea?: string;
  source?: string;
  rank?: number;
  rating?: number;
  averageCost?: number | null;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationVerified?: boolean;
  amapId?: string;
  amapDistrict?: string;
  note?: string;
  createdAt: string;
};

export type CheckInRecord = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  address?: string;
  category?: string;
  district?: string;
  businessArea?: string;
  source?: string;
  rank?: number;
  rating?: number;
  location?: string;
  locationVerified?: boolean;
  note?: string;
  thought?: string;
  review?: RestaurantReview;
  checkedInAt: string;
};

export type RestaurantReview = {
  taste: number;
  service: number;
  value: number;
  environment: number;
  comment?: string;
  images?: string[];
  updatedAt?: string;
};

export type RestaurantInput = {
  name: string;
  address?: string;
  category?: string;
  note?: string;
};
