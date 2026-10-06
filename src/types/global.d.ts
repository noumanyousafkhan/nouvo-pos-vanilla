export {}

declare global {
  interface Window {
    nouvo: {
      invoke: (channel: string, ...args: unknown[]) => Promise<any>
    }
  }
}
