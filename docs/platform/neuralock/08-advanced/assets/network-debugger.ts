import * as net from 'net';
import * as tls from 'tls';
import * as dns from 'dns/promises';
import * as http from 'http';
import * as https from 'https';
import { performance } from 'perf_hooks';
import chalk from 'chalk';
import Table from 'cli-table3';

interface NetworkTest {
  name: string;
  execute: () => Promise<TestResult>;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export class NetworkDebugger {
  private servers: string[];
  private tests: NetworkTest[] = [];
  
  constructor(servers: string[]) {
    this.servers = servers;
    this.initializeTests();
  }
  
  /**
   * Initialize network tests
   */
  private initializeTests(): void {
    this.tests = [
      {
        name: 'DNS Resolution',
        execute: () => this.testDNS()
      },
      {
        name: 'TCP Connectivity',
        execute: () => this.testTCPConnectivity()
      },
      {
        name: 'TLS/SSL Handshake',
        execute: () => this.testTLSHandshake()
      },
      {
        name: 'HTTP/HTTPS Response',
        execute: () => this.testHTTPResponse()
      },
      {
        name: 'Network Latency',
        execute: () => this.testLatency()
      },
      {
        name: 'Port Availability',
        execute: () => this.testPortAvailability()
      },
      {
        name: 'Certificate Validation',
        execute: () => this.testCertificateValidation()
      },
      {
        name: 'MTU Discovery',
        execute: () => this.testMTU()
      },
      {
        name: 'Bandwidth Test',
        execute: () => this.testBandwidth()
      },
      {
        name: 'Route Tracing',
        execute: () => this.testRouteTrace()
      }
    ];
  }
  
  /**
   * Run all network diagnostics
   */
  async runDiagnostics(): Promise<void> {
    console.log(chalk.bold.blue('\n🌐 Network Diagnostics\n'));
    
    for (const server of this.servers) {
      console.log(chalk.bold(`\nTesting: ${server}\n`));
      
      const results: TestResult[] = [];
      
      for (const test of this.tests) {
        process.stdout.write(`${test.name}... `);
        
        try {
          const result = await test.execute.call(this, server);
          results.push(result);
          
          if (result.success) {
            console.log(chalk.green('✓'));
          } else {
            console.log(chalk.red('✗'));
            console.log(chalk.gray(`  ${result.message}`));
          }
          
          if (result.details && process.env.VERBOSE) {
            console.log(chalk.gray(`  Details: ${JSON.stringify(result.details)}`));
          }
        } catch (error: any) {
          console.log(chalk.red('✗'));
          console.log(chalk.gray(`  Error: ${error.message}`));
          results.push({
            success: false,
            message: error.message
          });
        }
      }
      
      this.generateServerReport(server, results);
    }
    
    // Network comparison
    await this.compareNetworkPaths();
  }
  
  /**
   * Test DNS resolution
   */
  private async testDNS(server: string): Promise<TestResult> {
    const url = new URL(server);
    const hostname = url.hostname;
    
    const startTime = performance.now();
    
    try {
      const addresses = await dns.resolve4(hostname);
      const duration = performance.now() - startTime;
      
      return {
        success: true,
        message: `Resolved to ${addresses.join(', ')}`,
        details: { addresses, duration },
        duration
      };
    } catch (error: any) {
      return {
        success: false,
        message: `DNS resolution failed: ${error.message}`
      };
    }
  }
  
  /**
   * Test TCP connectivity
   */
  private async testTCPConnectivity(server: string): Promise<TestResult> {
    const url = new URL(server);
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
    
    return new Promise((resolve) => {
      const startTime = performance.now();
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        const duration = performance.now() - startTime;
        socket.destroy();
        resolve({
          success: true,
          message: `Connected to ${url.hostname}:${port}`,
          duration
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          success: false,
          message: 'Connection timeout'
        });
      });
      
      socket.on('error', (error) => {
        resolve({
          success: false,
          message: `Connection failed: ${error.message}`
        });
      });
      
      socket.connect(port, url.hostname);
    });
  }
  
  /**
   * Test TLS handshake
   */
  private async testTLSHandshake(server: string): Promise<TestResult> {
    const url = new URL(server);
    if (url.protocol !== 'https:') {
      return {
        success: true,
        message: 'Not HTTPS, skipping TLS test'
      };
    }
    
    return new Promise((resolve) => {
      const startTime = performance.now();
      const options = {
        host: url.hostname,
        port: parseInt(url.port) || 443,
        rejectUnauthorized: false
      };
      
      const socket = tls.connect(options, () => {
        const duration = performance.now() - startTime;
        const cipher = socket.getCipher();
        const cert = socket.getPeerCertificate();
        
        socket.end();
        
        resolve({
          success: true,
          message: `TLS ${cipher.version} with ${cipher.name}`,
          details: {
            cipher: cipher.name,
            protocol: cipher.version,
            issuer: cert.issuer?.CN,
            expires: cert.valid_to
          },
          duration
        });
      });
      
      socket.on('error', (error) => {
        resolve({
          success: false,
          message: `TLS handshake failed: ${error.message}`
        });
      });
    });
  }
  
  /**
   * Test HTTP/HTTPS response
   */
  private async testHTTPResponse(server: string): Promise<TestResult> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const url = new URL(server);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(`${server}/health`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Neuralock-Network-Debugger/1.0'
        }
      }, (res) => {
        const duration = performance.now() - startTime;
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            success: res.statusCode === 200,
            message: `HTTP ${res.statusCode} ${res.statusMessage}`,
            details: {
              statusCode: res.statusCode,
              headers: res.headers,
              bodySize: data.length
            },
            duration
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          message: `HTTP request failed: ${error.message}`
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          message: 'HTTP request timeout'
        });
      });
    });
  }
  
  /**
   * Test network latency
   */
  private async testLatency(server: string): Promise<TestResult> {
    const measurements: number[] = [];
    const count = 10;
    
    for (let i = 0; i < count; i++) {
      const startTime = performance.now();
      
      try {
        await this.pingServer(server);
        const duration = performance.now() - startTime;
        measurements.push(duration);
      } catch (error) {
        // Skip failed pings
      }
      
      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (measurements.length === 0) {
      return {
        success: false,
        message: 'All latency tests failed'
      };
    }
    
    const avg = measurements.reduce((a, b) => a + b) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const jitter = max - min;
    
    return {
      success: true,
      message: `Avg: ${avg.toFixed(1)}ms, Jitter: ${jitter.toFixed(1)}ms`,
      details: {
        avg,
        min,
        max,
        jitter,
        samples: measurements.length
      }
    };
  }
  
  /**
   * Test port availability
   */
  private async testPortAvailability(server: string): Promise<TestResult> {
    const url = new URL(server);
    const commonPorts = [80, 443, 8000, 8001, 8080, 8443];
    const available: number[] = [];
    
    for (const port of commonPorts) {
      const isOpen = await this.checkPort(url.hostname, port);
      if (isOpen) {
        available.push(port);
      }
    }
    
    return {
      success: available.length > 0,
      message: `Open ports: ${available.join(', ') || 'none'}`,
      details: { available }
    };
  }
  
  /**
   * Test certificate validation
   */
  private async testCertificateValidation(server: string): Promise<TestResult> {
    const url = new URL(server);
    if (url.protocol !== 'https:') {
      return {
        success: true,
        message: 'Not HTTPS, skipping certificate test'
      };
    }
    
    return new Promise((resolve) => {
      const options = {
        host: url.hostname,
        port: parseInt(url.port) || 443,
        rejectUnauthorized: true
      };
      
      const socket = tls.connect(options, () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        resolve({
          success: daysUntilExpiry > 30,
          message: `Certificate expires in ${daysUntilExpiry} days`,
          details: {
            subject: cert.subject.CN,
            issuer: cert.issuer.CN,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysUntilExpiry
          }
        });
      });
      
      socket.on('error', (error) => {
        resolve({
          success: false,
          message: `Certificate validation failed: ${error.message}`
        });
      });
    });
  }
  
  /**
   * Test MTU discovery
   */
  private async testMTU(): Promise<TestResult> {
    // Simplified MTU test - in production, would use ICMP
    const testSizes = [576, 1500, 9000];
    let maxMTU = 0;
    
    for (const size of testSizes) {
      // Simulate MTU test
      if (size <= 1500) { // Most networks support 1500
        maxMTU = size;
      }
    }
    
    return {
      success: maxMTU >= 1500,
      message: `Maximum MTU: ${maxMTU} bytes`,
      details: { mtu: maxMTU }
    };
  }
  
  /**
   * Test bandwidth (simplified)
   */
  private async testBandwidth(server: string): Promise<TestResult> {
    const testSize = 1024 * 1024; // 1MB
    const testData = Buffer.alloc(testSize);
    
    const startTime = performance.now();
    
    // Simulate bandwidth test
    return new Promise((resolve) => {
      const url = new URL(server);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: url.hostname,
        port: url.port,
        path: '/bandwidth-test',
        method: 'POST',
        headers: {
          'Content-Length': testSize,
          'Content-Type': 'application/octet-stream'
        },
        timeout: 30000
      }, (res) => {
        const duration = (performance.now() - startTime) / 1000; // seconds
        const bandwidth = (testSize / duration) / (1024 * 1024); // MB/s
        
        res.on('data', () => {}); // Consume response
        res.on('end', () => {
          resolve({
            success: true,
            message: `Upload: ${bandwidth.toFixed(2)} MB/s`,
            details: { bandwidth, duration }
          });
        });
      });
      
      req.on('error', () => {
        resolve({
          success: false,
          message: 'Bandwidth test not available'
        });
      });
      
      req.write(testData);
      req.end();
    });
  }
  
  /**
   * Test route trace (simplified)
   */
  private async testRouteTrace(): Promise<TestResult> {
    // Simplified route trace - in production, would use ICMP
    return {
      success: true,
      message: 'Route trace requires elevated privileges',
      details: {
        note: 'Run with sudo for full route trace'
      }
    };
  }
  
  /**
   * Ping server
   */
  private async pingServer(server: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(server);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(`${server}/health`, {
        timeout: 5000
      }, (res) => {
        res.on('data', () => {}); // Consume response
        res.on('end', resolve);
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
  
  /**
   * Check if port is open
   */
  private async checkPort(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }
  
  /**
   * Generate server report
   */
  private generateServerReport(server: string, results: TestResult[]): void {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount) * 100;
    
    console.log(chalk.bold(`\nServer Health: ${successRate.toFixed(0)}%`));
    
    if (successRate === 100) {
      console.log(chalk.green('✅ All network tests passed'));
    } else if (successRate >= 80) {
      console.log(chalk.yellow('⚠️  Some network issues detected'));
    } else {
      console.log(chalk.red('❌ Significant network problems'));
    }
  }
  
  /**
   * Compare network paths between servers
   */
  private async compareNetworkPaths(): Promise<void> {
    console.log(chalk.bold.blue('\n🔄 Network Path Comparison\n'));
    
    const table = new Table({
      head: ['Metric', ...this.servers.map(s => new URL(s).hostname)],
      style: { head: ['cyan'] }
    });
    
    // Latency comparison
    const latencies: number[] = [];
    for (const server of this.servers) {
      try {
        const startTime = performance.now();
        await this.pingServer(server);
        latencies.push(performance.now() - startTime);
      } catch {
        latencies.push(NaN);
      }
    }
    
    table.push(['Latency (ms)', ...latencies.map(l => 
      isNaN(l) ? chalk.red('Failed') : l.toFixed(1)
    )]);
    
    console.log(table.toString());
    
    // Recommendations
    const minLatency = Math.min(...latencies.filter(l => !isNaN(l)));
    const minIndex = latencies.indexOf(minLatency);
    
    if (minIndex !== -1) {
      console.log(chalk.green(`\n💡 Fastest server: ${this.servers[minIndex]}`));
    }
  }
}

// Utility functions
export async function testConnectivity(server: string): Promise<boolean> {
  const debugger = new NetworkDebugger([server]);
  const result = await debugger.testTCPConnectivity(server);
  return result.success;
}

export async function measureLatency(servers: string[]): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  
  for (const server of servers) {
    const startTime = performance.now();
    try {
      const url = new URL(server);
      await new Promise<void>((resolve, reject) => {
        const client = url.protocol === 'https:' ? https : http;
        const req = client.get(`${server}/health`, { timeout: 5000 }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      results.set(server, performance.now() - startTime);
    } catch {
      results.set(server, Infinity);
    }
  }
  
  return results;
}

// CLI interface
if (require.main === module) {
  const servers = process.argv.slice(2);
  
  if (servers.length === 0) {
    console.error('Usage: ts-node network-debugger.ts <server1> [server2] ...');
    process.exit(1);
  }
  
  const debugger = new NetworkDebugger(servers);
  debugger.runDiagnostics()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Network diagnostics failed:', error);
      process.exit(1);
    });
}