import { Client, Local, Environment } from "../client";

const apiUrl = import.meta.env.PROD
  ? Environment("production")
  : Local;

export const api = new Client(apiUrl);

// Re-export types for convenient importing
export type { Customer } from "~backend/customer/create";
export type { Estimate, LineItem } from "~backend/estimate/types";
export type { Invoice } from "~backend/invoice/types";
export type { Photo } from "~backend/photo/upload";
