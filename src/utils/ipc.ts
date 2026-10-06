export type IpcResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; [key: string]: any } }

export async function invokeSafe<T = any>(
  channel: string,
  ...args: any[]
): Promise<IpcResponse<T>> {
  try {
    const plainArgs = args.map((arg) => {
      if (arg === null || arg === undefined) return arg
      if (typeof arg === 'object') {
        try { return JSON.parse(JSON.stringify(arg)) } catch { return arg }
      }
      return arg
    })

    const res: any = await (window as any).nouvo.invoke(channel, ...plainArgs)

    if (res && typeof res === 'object' && 'ok' in res) {
      if (res.ok) {
        return { ok: true, data: res.data as T }
      } else {
        return { ok: false, error: res.error || { message: 'Unknown error' } }
      }
    }

    return { ok: true, data: res as T }
  } catch (err) {
    console.error(`IPC call failed: ${channel}`, err)
    return { ok: false, error: { message: String(err) } }
  }
}
