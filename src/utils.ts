const protocolRegex = /^https?:\/\//i

export const ensureProtocol = (maybeFQDN: string) => {
  const hasProtocol = protocolRegex.test(maybeFQDN)
  if (!hasProtocol) {
    return `https://${maybeFQDN}`
  }

  return maybeFQDN
}

export const ignoreProtocol = (maybeFQDN: string) => {
  const hasProtocol = protocolRegex.test(maybeFQDN)
  if (hasProtocol) {
    return maybeFQDN.replace(protocolRegex, "")
  }

  return maybeFQDN
}
