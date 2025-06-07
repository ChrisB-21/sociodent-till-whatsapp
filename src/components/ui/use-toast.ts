import * as React from "react"
import { ToastActionElement, type ToastProps } from "@/components/ui/toast"
import { useToast as usePrimitiveToast } from "@/components/ui/use-toast"

const toast = (props: ToastProps) => {
  const event = new CustomEvent("custom-toast", { detail: props })
  window.dispatchEvent(event)
}

function useToast() {
  const toastProps = usePrimitiveToast()

  React.useEffect(() => {
    const handler = (event: CustomEvent<ToastProps>) => {
      toastProps.toast(event.detail)
    }

    window.addEventListener("custom-toast", handler as EventListener)

    return () => {
      window.removeEventListener("custom-toast", handler as EventListener)
    }
  }, [toastProps])

  return toastProps
}

export { useToast, toast }
