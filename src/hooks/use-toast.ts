import { toast as toastFn } from "@/components/ui/toaster";

export function useToast() {
  return { toast: toastFn };
}
