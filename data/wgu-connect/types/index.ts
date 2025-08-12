export interface WguConnectGroupRaw {
  id: string;
  name: string;
  full_name?: string;
  category?: string;
  course_codes?: string[];
  url: string;
  discussions_url?: string;
  resources_url?: string;
  verified?: boolean;
}

export function isWguConnectGroupRaw(obj: any): obj is WguConnectGroupRaw {
  return !!(
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.url === 'string'
  );
}
