import { error, getInput, info, setFailed } from "@actions/core"
import { APIResponse } from "./types"
import { ensureProtocol, ignoreProtocol } from "./utils"

export interface Config {
  mode: string
  domainName: string
  appwardenApiToken: string
  debug: boolean
}

export const getConfig = (): Config => ({
  mode: getInput("domain-mode"),
  domainName: getInput("domain-name"),
  appwardenApiToken: getInput("appwarden-token"),
  debug: getInput("debug") === "true",
})

export const debug = (msg: string, isDebug: boolean) => {
  if (isDebug) {
    console.log(msg)
  }
}

export async function runAction(config: Config) {
  try {
    if (!config.appwardenApiToken) {
      throw new Error("Provide an Appwarden API token parameter")
    }

    if (!config.mode) {
      throw new Error(
        `Provide an action parameter ["lock", "unlock", "test-lock", "test-unlock"]`,
      )
    }
    if (!["lock", "unlock", "test-lock", "test-unlock"].includes(config.mode)) {
      throw new Error(`Invalid action parameter: ${config.mode}`)
    }

    if (!config.domainName) {
      throw new Error("Provide a domainName parameter")
    }
    const { href } = new URL(
      "/v1/domain-mode",
      "https://bot-gateway.appwarden.io",
    )

    debug(href, config.debug)

    const response = await fetch(href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: config.mode,
        fqdn: ignoreProtocol(config.domainName),
        appwardenApiToken: config.appwardenApiToken,
      }),
    })

    if (response.status !== 200) {
      throw new Error("Bad response from Appwarden API")
    }

    const result = (await response.json()) as APIResponse

    debug(JSON.stringify(result, null, 2), config.debug)

    if (result.error) {
      throw new Error(result.error.message)
    }

    info(
      `🏁 Appwarden placed ${
        new URL(
          config.mode.includes("test") ? "_appwarden/test" : "",
          ensureProtocol(config.domainName),
        ).href
      } into ${
        config.mode
      } mode. Changes may take up to 30 seconds to take effect.`,
    )
  } catch (err: unknown) {
    err instanceof Error && error(err.message)
    setFailed("🚨 Appwarden Action failed")
  }
}

async function main() {
  const config = getConfig()
  await runAction(config)
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
