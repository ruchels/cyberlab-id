/**
 * Subnet Calculator Tool - Core Logic
 * Fully accurate IPv4 Subnetting & CIDR calculations
 */

export interface SubnetResult {
  ipAddress: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsableHost: string;
  lastUsableHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: "A" | "B" | "C" | "D" | "E";
  isPrivate: boolean;
  binaryIP: string;
  binarySubnetMask: string;
}

export function validateIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return false;
    // Check leading zero like "01"
    if (part.length > 1 && part.startsWith("0")) return false;
  }
  return true;
}

export function ipToNumber(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

export function numberToBinary(num: number): string {
  const binary = (num >>> 0).toString(2).padStart(32, "0");
  return `${binary.slice(0, 8)}.${binary.slice(8, 16)}.${binary.slice(16, 24)}.${binary.slice(24, 32)}`;
}

export function getIPClass(firstOctet: number): "A" | "B" | "C" | "D" | "E" {
  if (firstOctet >= 1 && firstOctet <= 126) return "A";
  if (firstOctet >= 128 && firstOctet <= 191) return "B";
  if (firstOctet >= 192 && firstOctet <= 223) return "C";
  if (firstOctet >= 224 && firstOctet <= 239) return "D"; // Multicast
  return "E"; // Experimental
}

export function isPrivateIP(num: number): boolean {
  // 10.0.0.0/8
  if ((num & 0xff000000) >>> 0 === 0x0a000000) return true;
  // 172.16.0.0/12
  if ((num & 0xfff00000) >>> 0 === 0xac100000) return true;
  // 192.168.0.0/16
  if ((num & 0xffff0000) >>> 0 === 0xc0a80000) return true;
  // 127.0.0.0/8 (Loopback)
  if ((num & 0xff000000) >>> 0 === 0x7f000000) return true;
  // 169.254.0.0/16 (APIPA)
  if ((num & 0xffff0000) >>> 0 === 0xa9fe0000) return true;
  return false;
}

export function calculateSubnet(ipInput: string, cidrInput: number): SubnetResult {
  if (!validateIPv4(ipInput)) {
    throw new Error(`Format alamat IP tidak valid: '${ipInput}'. Gunakan format X.X.X.X (0-255).`);
  }
  if (cidrInput < 0 || cidrInput > 32) {
    throw new Error(`Panjang prefix CIDR harus antara 0 dan 32 (diterima: ${cidrInput})`);
  }

  const ipNum = ipToNumber(ipInput);
  const firstOctet = parseInt(ipInput.split(".")[0], 10);

  // Subnet mask number
  const maskNum = cidrInput === 0 ? 0 : (~0 << (32 - cidrInput)) >>> 0;
  const wildcardNum = ~maskNum >>> 0;

  // Network & Broadcast
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  // Total & Usable Hosts
  const totalHosts = Math.pow(2, 32 - cidrInput);
  let usableHosts = 0;
  let firstHostNum = 0;
  let lastHostNum = 0;

  if (cidrInput === 32) {
    usableHosts = 1;
    firstHostNum = ipNum;
    lastHostNum = ipNum;
  } else if (cidrInput === 31) {
    // RFC 3021 Point-to-Point
    usableHosts = 2;
    firstHostNum = networkNum;
    lastHostNum = broadcastNum;
  } else {
    usableHosts = Math.max(0, totalHosts - 2);
    firstHostNum = (networkNum + 1) >>> 0;
    lastHostNum = (broadcastNum - 1) >>> 0;
  }

  return {
    ipAddress: numberToIp(ipNum),
    cidr: cidrInput,
    networkAddress: numberToIp(networkNum),
    broadcastAddress: numberToIp(broadcastNum),
    subnetMask: numberToIp(maskNum),
    wildcardMask: numberToIp(wildcardNum),
    firstUsableHost: numberToIp(firstHostNum),
    lastUsableHost: numberToIp(lastHostNum),
    totalHosts,
    usableHosts,
    ipClass: getIPClass(firstOctet),
    isPrivate: isPrivateIP(ipNum),
    binaryIP: numberToBinary(ipNum),
    binarySubnetMask: numberToBinary(maskNum),
  };
}
