export {};

declare global {
  interface Window {
    backpack?: {
      solana?: {
        isBackpack?: boolean;
      };
    };
  }
}
