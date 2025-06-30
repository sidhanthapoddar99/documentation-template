// Rate limiting configuration
const rateLimits = {
  sessionCreation: {
    window: '15m',
    max: 5
  },
  encryption: {
    window: '1m',
    max: 100
  },
  decryption: {
    window: '1m',
    max: 200
  }
};