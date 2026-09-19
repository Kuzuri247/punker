import { Daytona } from "@daytona/sdk"

let _daytona: Daytona | null = null

export function getDaytona(): Daytona {
  if (!_daytona) {
    if (!process.env.DAYTONA_API_KEY) {
      throw new Error("DAYTONA_API_KEY is not set")
    }
    _daytona = new Daytona()
  }
  return _daytona
}

export const daytona: Daytona = new Proxy({} as Daytona, {
  get(_target, prop, receiver) {
    const instance = getDaytona()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === "function" ? value.bind(instance) : value
  },
})

