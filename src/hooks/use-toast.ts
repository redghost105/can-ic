import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Define dispatch at module level
let dispatch: React.Dispatch<Action>

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

interface ToastContextType {
  toasts: ToasterToast[]
  toast: (props: Omit<ToasterToast, "id">) => string
  dismiss: (toastId?: string) => void
  update: (id: string, props: Partial<ToasterToast>) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

function useToast() {
  const context = React.useContext(ToastContext)

  if (context === null) {
    const [state, localDispatch] = React.useReducer(reducer, {
      toasts: [],
    })
    
    // Assign the dispatch function
    dispatch = localDispatch

    const toast = React.useCallback(
      (props: Omit<ToasterToast, "id">) => {
        const id = genId()

        const update = (props: Partial<ToasterToast>) =>
          localDispatch({
            type: actionTypes.UPDATE_TOAST,
            toast: { ...props, id },
          })

        const dismiss = () =>
          localDispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

        localDispatch({
          type: actionTypes.ADD_TOAST,
          toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
              if (!open) dismiss()
            },
          },
        })

        return id
      },
      [localDispatch]
    )

    const update = React.useCallback(
      (id: string, props: Partial<ToasterToast>) => {
        localDispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      },
      [localDispatch]
    )

    const dismiss = React.useCallback(
      (toastId?: string) => {
        localDispatch({ type: actionTypes.DISMISS_TOAST, toastId })
      },
      [localDispatch]
    )

    return {
      toasts: state.toasts,
      toast,
      dismiss,
      update,
    }
  }

  return context
}

function ToastProvider({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [state, localDispatch] = React.useReducer(reducer, {
    toasts: [],
  })
  
  // Assign the dispatch function
  dispatch = localDispatch

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = genId()

      const update = (props: Partial<ToasterToast>) =>
        localDispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })

      const dismiss = () =>
        localDispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

      localDispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return id
    },
    [localDispatch]
  )

  const update = React.useCallback(
    (id: string, props: Partial<ToasterToast>) => {
      localDispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
    },
    [localDispatch]
  )

  const dismiss = React.useCallback(
    (toastId?: string) => {
      localDispatch({ type: actionTypes.DISMISS_TOAST, toastId })
    },
    [localDispatch]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts: state.toasts,
        toast,
        dismiss,
        update,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export { useToast, ToastProvider } 