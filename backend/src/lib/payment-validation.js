export const MINIMUM_XLM_PAYMENT_AMOUNT = 0.01;

const REQUIRED_FIELDS = ["amount", "asset", "recipient"];
const VALID_MEMO_TYPES = ["text", "id", "hash", "return"];

export function validateCreatePayment(body) {
  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      return `Missing field: ${field}`;
    }
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return "Amount must be a positive number";
  }

  const asset = String(body.asset || "").toUpperCase();
  if (asset === "XLM" && amount < MINIMUM_XLM_PAYMENT_AMOUNT) {
    return `Minimum XLM payment amount is ${MINIMUM_XLM_PAYMENT_AMOUNT}`;
  }

  if (asset !== "XLM" && !body.asset_issuer) {
    return "asset_issuer is required for non-native assets";
  }

  if (body.memo && !body.memo_type) {
    return "memo_type is required when memo is provided";
  }
  if (body.memo_type && !body.memo) {
    return "memo is required when memo_type is provided";
  }
  if (
    body.memo_type &&
    !VALID_MEMO_TYPES.includes(body.memo_type.toLowerCase())
  ) {
    return `Invalid memo_type. Must be one of: ${VALID_MEMO_TYPES.join(", ")}`;
  }

  return null;
}
