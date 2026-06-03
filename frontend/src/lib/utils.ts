import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUUID(value?: string | null): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function resolveBookingServiceId(
  supabase: any,
  serviceId?: string | null,
  serviceName?: string,
  options?: { price?: number; image_url?: string | null; category?: string | null; description?: string | null }
): Promise<string | null> {
  if (isUUID(serviceId)) return serviceId;
  if (!serviceName) return null;

  try {
    const { data: existingService, error: findError } = await supabase
      .from('services')
      .select('id')
      .eq('name', serviceName)
      .limit(1)
      .single();

    if (!findError && existingService?.id && isUUID(existingService.id)) {
      return existingService.id;
    }

    const payload: any = {
      name: serviceName,
      price: options?.price ?? 0,
      image_url: options?.image_url ?? null,
      category: options?.category ?? null,
      description: options?.description ?? `Auto-created service for booking: ${serviceName}`,
    };

    const { data: insertedService, error: insertError } = await supabase
      .from('services')
      .insert([payload])
      .select('id')
      .single();

    if (insertError) throw insertError;
    if (insertedService?.id && isUUID(insertedService.id)) return insertedService.id;
  } catch (err) {
    console.error('resolveBookingServiceId error:', err);
  }

  return null;
}
