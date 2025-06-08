import { PropertyItem } from '@/models/property';

/**
 * Generates a display name for a property based on its address and description
 * @param property - The property object
 * @returns A formatted string representing the property
 */
export function getPropertyDisplayName(property: PropertyItem): string {
  if (!property) {
    return 'Unknown Property';
  }

  // If there's a description, use it as the primary identifier
  if (property.description && property.description.trim()) {
    return property.description;
  }

  // Fallback to address-based name
  const { address } = property;
  if (!address) {
    return 'Property (No Address)';
  }

  const parts = [];
  
  if (address.street) {
    parts.push(address.street);
  }
  
  if (address.suburb) {
    parts.push(address.suburb);
  }
  
  if (address.state) {
    parts.push(address.state);
  }
  
  if (address.postcode) {
    parts.push(address.postcode);
  }

  return parts.length > 0 ? parts.join(', ') : 'Property (Incomplete Address)';
}

/**
 * Generates a short address display for a property
 * @param property - The property object
 * @returns A formatted short address string
 */
export function getPropertyShortAddress(property: PropertyItem): string {
  if (!property?.address) {
    return 'No Address';
  }

  const { address } = property;
  const parts = [];
  
  if (address.street) {
    parts.push(address.street);
  }
  
  if (address.suburb) {
    parts.push(address.suburb);
  }

  return parts.length > 0 ? parts.join(', ') : 'Incomplete Address';
}
