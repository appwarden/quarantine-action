import { error, getInput, info, setFailed } from "@actions/core"
import { ignoreProtocol } from "./utils"

const config = {
  mode: getInput("domain-mode"),
  domainName: getInput("domain-name"),
  appwardenApiToken: getInput("appwarden-token"),
} as const

async function main() {
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

    await fetch(new URL("/v1/domain-mode", "https://api.appwarden.io").href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: config.mode,
        fqdn: ignoreProtocol(config.domainName),
        appwardenApiToken: config.appwardenApiToken,
      }),
    })

    info(
      `🏁 Appwarden placed ${config.domainName} into ${config.mode} mode. Changes may take up to 30 seconds to take effect.`,
    )
  } catch (err: unknown) {
    err instanceof Error && error(err.message)
    setFailed("🚨 Appwarden Action failed")
  }
}

main()
