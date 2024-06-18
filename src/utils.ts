const protocolRegex = /^https?:\/\//i

export const ignoreProtocol = (maybeFQDN: string) => {
  const hasProtocol = protocolRegex.test(maybeFQDN)
  if (hasProtocol) {
    return maybeFQDN.replace(protocolRegex, "")
  }

  return maybeFQDN
}
