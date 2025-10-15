export interface User {
  id:number;
  fullName:string;
  email:string;
  phone:string;
  role:string;
  address?:string;
}

export interface UserRq {
  Id: number;
  FullName: string;
  Email: string;
  Phone: string;
  Address: string | null;
  Role: "Customer" | "Admin" | string;
  CreatedAt: string; 
  Disabled: boolean;
  IsDeleted: boolean;
}


export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: string; 
  address?: string;
}  

export interface Product {
  Id?: string;
  ProductName: string;
  Description?: string;
  Category: string;
  Price: number;
  Stock: number;
  ImageUrl?: string;
  IsActive?: boolean;
  CreatedDate: string;
  UpdatedDate?: string;
}

export interface CartItem {
  cartId: string;
  product: {
    componentId?: number;
    productId?: number;
    quantity: number;
    unitPrice: number;
    componentName: string;
    imageUrl: string;
    itemType: "component" | "product";
  };
  quantity: number;
}



// Nested interface for the items in the CompatibleComponents array
export interface CompatibleComponent {
  Id: number;
  Name: string;
}

export interface Component {
  Id: number;
  Name: string;
  Type: string;
  UnitPrice: number;
  Stock: number;
  ImageUrl: string;
  Category: string;
  Description: string;
  CompatibleComponents: CompatibleComponent[]; 
}


// model.ts (or ordersModel.ts)

/**
 * Defines the structure for a single item (component) within an order.
 */
export interface OrderItem {
  OrderId: number;
  OrderItemId: number;
  ItemId: number;
  Quantity: number;
  UnitPrice: number;
  ItemType: "component" | "product";
  Subtotal: number;
  ItemName: string;
  ItemCategory: string;
  ImageUrl: string;
}

// ----------------------------------------------------------------------

/**
 * Defines the structure for the main Order object with specific status types.
 */
export interface Order {
  Id: number;
  OrderNumber: string;
  CustomerId: number;
  CustomerName: string;
  Email: string;
  Phone: string;
  Address: string | null;
  FulfillmentType: "delivery" | "collection";

  /**
   * Status must be one of the defined string literals.
   */
  Status:
    | "assembling"
    | "done-assembling"
    | "ready-for-delivery"
    | "courier-on-the-way"
    | "ready-for-collection"
    | "completed";

  TotalAmount: number;
  CreatedAt: string; // ISO 8601 date string
  UpdatedAt: string | null;
  CompletedAt: string | null;
  Items: OrderItem[];
}


export interface Notification {
  Id: number;
  To: number;
  Title: string;
  Message: string;
  NotificationType: string;
  CreatedDate: string; 
  IsRead: boolean;
}

