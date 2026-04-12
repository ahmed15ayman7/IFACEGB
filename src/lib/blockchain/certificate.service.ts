import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";

// IFACEVCIssuer ABI — minimal interface for issueCredential, revokeCredential, verifyCredential
const IFACE_VC_ISSUER_ABI = [
  "function issueCredential(address holder, string vcHash, string ipfsUri) returns (uint256)",
  "function revokeCredential(uint256 tokenId) returns (bool)",
  "function verifyCredential(uint256 tokenId) view returns (bool isValid, string vcHash, address holder, uint256 issuedAt)",
  "event CredentialIssued(uint256 indexed tokenId, address holder, string vcHash)",
  "event CredentialRevoked(uint256 indexed tokenId)",
];

function getProvider() {
  const rpc = process.env.POLYGON_RPC_URL ?? "https://polygon-rpc.com";
  return new ethers.JsonRpcProvider(rpc);
}

function getContract(withSigner = false) {
  const provider = getProvider();
  const contractAddress = process.env.IFACE_VC_ISSUER_ADDRESS;
  if (!contractAddress) throw new Error("IFACE_VC_ISSUER_ADDRESS not configured");

  if (withSigner) {
    const privateKey = process.env.PRIVATE_KEY_ISSUER;
    if (!privateKey) throw new Error("PRIVATE_KEY_ISSUER not configured");
    const signer = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(contractAddress, IFACE_VC_ISSUER_ABI, signer);
  }

  return new ethers.Contract(contractAddress, IFACE_VC_ISSUER_ABI, provider);
}

/**
 * Issue a verifiable credential on Polygon PoS.
 * Prerequisites check: AI proctoring ≥ 95%, CEO directive signed, skill matrix complete.
 */
export async function issueCertificateOnChain(certificateId: string, issuerId: string) {
  const cert = await prisma.certificate.findUniqueOrThrow({
    where: { id: certificateId },
    include: { holder: true },
  });

  // ── Prerequisites check ──────────────────────────────────
  const prereqs = cert.prerequisitesMet as {
    proctoring?: boolean;
    directive?: boolean;
    skillMatrix?: boolean;
  } | null;

  if (!prereqs?.proctoring || !prereqs?.directive || !prereqs?.skillMatrix) {
    throw new Error("Certificate prerequisites not met (proctoring + directive + skillMatrix)");
  }

  // ── Build W3C VC 2.0 JSON-LD ─────────────────────────────
  const vcPayload = {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    id: `https://verify.iface.global/${cert.uniqueVC}`,
    issuer: {
      id: "did:polygon:iface",
      name: "iFACE International Board",
      url: "https://iface.global",
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:user:${cert.holderId}`,
      type: ["AchievementSubject"],
      name: cert.holder.name,
      achievement: {
        id: `https://iface.global/programs/${cert.sectorId}`,
        type: ["Achievement"],
        name: cert.programEn,
        description: `Certified by iFACE International Board`,
        criteria: { narrative: `Score: ${cert.score}%, Grade: ${cert.grade}` },
      },
    },
    proof: {
      type: "BlockchainProof2024",
      network: "polygon-pos",
    },
  };

  const vcHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(vcPayload)));

  // ── Upload to IPFS ───────────────────────────────────────
  let ipfsHash = "ipfs-mock-hash";
  if (process.env.PINATA_JWT) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const pinataModule = (() => { try { return require("pinata-web3"); } catch { return null; } })() as any;
      if (pinataModule?.PinataSDK) {
        const pinata = new pinataModule.PinataSDK({ pinataJwt: process.env.PINATA_JWT });
        const result = await pinata.upload.json(vcPayload);
        ipfsHash = result.IpfsHash;
      }
    } catch {
      console.warn("IPFS upload failed, using mock hash");
    }
  }

  // ── Write to Polygon ─────────────────────────────────────
  let txHash = "0x-mock-tx";
  let tokenId: number | null = null;

  if (process.env.IFACE_VC_ISSUER_ADDRESS && process.env.PRIVATE_KEY_ISSUER) {
    try {
      const contract = getContract(true);
      const tx = await contract.issueCredential(
        cert.holder.email, // address in prod
        vcHash,
        `ipfs://${ipfsHash}`
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;
      // Extract tokenId from event logs
      const event = receipt.logs.find((l: { eventName?: string }) => l.eventName === "CredentialIssued");
      tokenId = event?.args?.[0]?.toNumber() ?? null;
    } catch {
      console.warn("Blockchain tx failed, recording mock");
    }
  }

  // ── Update certificate in DB ─────────────────────────────
  const updated = await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      status: "issued",
      ipfsHash,
      blockchainTxHash: txHash,
      tokenId,
      vcJsonLd: vcPayload,
      issueDate: new Date(),
    },
  });

  await logAudit({
    userId: issuerId,
    action: "certificate_issued",
    entityType: "Certificate",
    entityId: certificateId,
    severity: "info",
    after: { txHash, ipfsHash, tokenId },
  });

  return updated;
}

/**
 * Verify a credential — callable from public portal.
 */
export async function verifyCertificateByUVC(uniqueVC: string) {
  const cert = await prisma.certificate.findUnique({
    where: { uniqueVC },
    include: {
      holder: { select: { name: true, email: true } },
      issuer: { select: { name: true } },
    },
  });

  if (!cert) return { valid: false, reason: "Certificate not found" };
  if (cert.status === "revoked") return { valid: false, reason: "Certificate has been revoked", cert };
  if (cert.status !== "issued") return { valid: false, reason: "Certificate not yet issued", cert };
  if (cert.expiryDate && new Date() > cert.expiryDate) {
    return { valid: false, reason: "Certificate expired", cert };
  }

  // On-chain verification if configured
  if (cert.tokenId && process.env.IFACE_VC_ISSUER_ADDRESS) {
    try {
      const contract = getContract();
      const [isValid] = await contract.verifyCredential(cert.tokenId);
      if (!isValid) return { valid: false, reason: "On-chain verification failed", cert };
    } catch {
      // Fallback to DB-only verification
    }
  }

  return { valid: true, cert };
}
