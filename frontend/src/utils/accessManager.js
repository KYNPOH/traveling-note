export const isValidToken = (token) => {
    // 仮の検証：本来はDBなどで「使用済みかどうか」を確認
    const usedTokens = ["xyz789", "def456"]; // 使用済みトークン例
    return token && !usedTokens.includes(token);
  };
  