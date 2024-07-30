declare global {
  interface Window {
    ethereum: EthereumProvider | null;
  }
}

export {};
