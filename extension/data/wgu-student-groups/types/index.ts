export interface WguStudentGroupRaw {
  id: string;
  name: string;
  description?: string;
  category?: string;
  url: string; // group hub URL
  type: 'open' | 'closed' | 'private';
  access_requirements?: string;
  target_audience?: string;
}

export function isWguStudentGroupRaw(obj: any): obj is WguStudentGroupRaw {
  return !!(
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.type === 'string'
  );
}
