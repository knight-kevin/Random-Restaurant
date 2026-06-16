export type Restaurant = {
  id: string;
  name: string;
  address?: string;
  note?: string;
  createdAt: string;
};

export type CheckInRecord = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  address?: string;
  note?: string;
  checkedInAt: string;
};

export type RestaurantInput = {
  name: string;
  address?: string;
  note?: string;
};
