import * as StellarSdk from "stellar-sdk";

export interface PaymentTransactionParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
  horizonUrl: string;
  networkPassphrase: string;
}

export interface PathPaymentTransactionParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  sendMax: string;
  sendAssetCode: string;
  sendAssetIssuer: string | null;
  destAmount: string;
  destAssetCode: string;
  destAssetIssuer: string | null;
  path: Array<{ asset_code: string; asset_issuer: string | null }>;
  horizonUrl: string;
  networkPassphrase: string;
}

/**
 * Resolve a Stellar asset based on code and issuer
 */
export function resolveAsset(assetCode: string, assetIssuer: string | null): StellarSdk.Asset {
  if (assetCode === "XLM" || assetCode === "native") {
    return StellarSdk.Asset.native();
  }

  if (!assetIssuer) {
    throw new Error("Asset issuer is required for non-native assets");
  }

  return new StellarSdk.Asset(assetCode, assetIssuer);
}

/**
 * Build a payment transaction for submission to the Stellar network
 */
export async function buildPaymentTransaction(
  params: PaymentTransactionParams
): Promise<string> {
  try {
    const server = new StellarSdk.Horizon.Server(params.horizonUrl);

    // Load the source account details
    const sourceAccount = await server.loadAccount(params.sourcePublicKey);

    // Resolve the asset
    const asset = resolveAsset(params.assetCode, params.assetIssuer);

    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: params.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: params.destinationPublicKey,
          asset: asset,
          amount: params.amount,
        })
      )
      .setTimeout(300)
      .build();

    return transaction.toXDR();
  } catch (error) {
    throw new Error(
      `Failed to build payment transaction: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Build a path payment (strict receive) transaction.
 * The sender pays up to `sendMax` of the source asset so that the
 * destination receives exactly `destAmount` of the destination asset.
 */
export async function buildPathPaymentTransaction(
  params: PathPaymentTransactionParams
): Promise<string> {
  try {
    const server = new StellarSdk.Horizon.Server(params.horizonUrl);
    const sourceAccount = await server.loadAccount(params.sourcePublicKey);

    const sendAsset = resolveAsset(params.sendAssetCode, params.sendAssetIssuer);
    const destAsset = resolveAsset(params.destAssetCode, params.destAssetIssuer);

    const stellarPath = params.path.map((p) => resolveAsset(p.asset_code, p.asset_issuer));

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: params.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.pathPaymentStrictReceive({
          sendAsset,
          sendMax: params.sendMax,
          destination: params.destinationPublicKey,
          destAsset,
          destAmount: params.destAmount,
          path: stellarPath,
        })
      )
      .setTimeout(300)
      .build();

    return transaction.toXDR();
  } catch (error) {
    throw new Error(
      `Failed to build path payment transaction: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
