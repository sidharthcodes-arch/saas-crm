export interface User {
  id: number;
  name: string;
  email: string;
  workspace_id: number;
  role_id: number;
  is_active: boolean;
}

export interface Workspace {
  id: number;
  name: string;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  workspace: Workspace;
}

export interface Lead {
  id: number;
  workspace_id: number;
  status_id: number;
  assigned_to: number | null;
  property_id: number | null;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  created_by: number;
  converted_contact_id: number | null;
  status_name: string;
  property_name:string;
  assigned_user_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  workspace_id: number;
  created_from_lead_id: number | null;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  workspace_id: number;
  contact_id: number;
  status_id: number;
  total_amount: number;
  closed_at: string | null;
  contact_name: string;
  status_name: string;
  items: DealItem[];
  created_at: string;
}

export interface DealItem {
  id: number;
  deal_id: number;
  property_id: number;
  price: number;
  property_name: string;
  property_code: string;
  area_sqft: number;
}

export interface Property {
  id: number;
  workspace_id: number;
  property_type_id: number;
  parent_property_id: number | null;
  status_id: number;
  name: string;
  code: string;
  area_sqft: number | null;
  price: number | null;
  is_sellable: boolean;
  address: string | null;
  city: string | null;
  description: string | null;
  property_type_name: string;
  status_name: string;
  created_at: string;
}

export interface Activity {
  id: number;
  workspace_id: number;
  entity_type: string;
  entity_id: number;
  type: string;
  description: string;
  created_by: number;
  creator_name: string;
  activity_at: string;
  created_at: string;
}

export interface DashboardStats {
  leads: {
    total: number;
    by_status: { status_name: string; count: number }[];
    new_this_month: number;
  };
  contacts: {
    total: number;
    new_this_month: number;
  };
  deals: {
    total: number;
    total_value: number;
    won: { count: number; value: number };
    lost: { count: number };
    open: { count: number; value: number };
  };
  properties: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  recent_activities: Activity[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    last_page: number;
  };
}
