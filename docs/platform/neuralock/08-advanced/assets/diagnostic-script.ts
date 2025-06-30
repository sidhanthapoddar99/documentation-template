#!/usr/bin/env node

import { NeuralockClient } from '@neuralock/sdk';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { performance } from 'perf_hooks';

interface DiagnosticConfig {
  servers: string[];
  contractAddress?: string;
  verbose: boolean;
  timeout: number;
}

interface ServerDiagnostic {
  url: string;
  reachable: boolean;
  healthy: boolean;
  version?: string;
  latency?: number;
  thresholdStatus?: any;
  errors: string[];
  warnings: string[];
}

interface ThresholdDiagnostic {
  configured: { k: number; n: number };
  actual: { available: number; healthy: number };
  status: 'healthy' | 'degraded' | 'critical';
  missingServers: string[];
  recommendations: string[];
}

export class NeuralockDiagnostics {
  private config: DiagnosticConfig;
  private results: Map<string, ServerDiagnostic> = new Map();
  
  constructor(config: DiagnosticConfig) {
    this.config = config;
  }
  
  /**
   * Run complete diagnostic suite
   */
  async runDiagnostics(): Promise<void> {
    console.log(chalk.bold.blue('\n🔍 Neuralock Diagnostics\n'));
    
    // Test 1: Server Connectivity
    await this.testServerConnectivity();
    
    // Test 2: Server Health
    await this.testServerHealth();
    
    // Test 3: Threshold Status
    await this.testThresholdStatus();
    
    // Test 4: Contract Verification
    if (this.config.contractAddress) {
      await this.testContractVerification();
    }
    
    // Test 5: End-to-End Test
    await this.testEndToEnd();
    
    // Test 6: Performance Test
    await this.testPerformance();
    
    // Generate Report
    this.generateReport();
  }
  
  /**
   * Test server connectivity
   */
  private async testServerConnectivity(): Promise<void> {
    const spinner = ora('Testing server connectivity...').start();
    
    const connectivityPromises = this.config.servers.map(async (server) => {
      const startTime = performance.now();
      const result: ServerDiagnostic = {
        url: server,
        reachable: false,
        healthy: false,
        errors: [],
        warnings: []
      };
      
      try {
        const response = await axios.get(`${server}/health`, {
          timeout: this.config.timeout,
          validateStatus: () => true
        });
        
        result.reachable = true;
        result.latency = performance.now() - startTime;
        
        if (response.status !== 200) {
          result.errors.push(`Health endpoint returned ${response.status}`);
        }
        
        if (result.latency > 1000) {
          result.warnings.push(`High latency: ${result.latency.toFixed(0)}ms`);
        }
      } catch (error: any) {
        result.errors.push(`Connection failed: ${error.message}`);
      }
      
      this.results.set(server, result);
    });
    
    await Promise.all(connectivityPromises);
    
    const reachableCount = Array.from(this.results.values())
      .filter(r => r.reachable).length;
    
    if (reachableCount === this.config.servers.length) {
      spinner.succeed(`All ${this.config.servers.length} servers are reachable`);
    } else {
      spinner.warn(`Only ${reachableCount}/${this.config.servers.length} servers are reachable`);
    }
  }
  
  /**
   * Test server health
   */
  private async testServerHealth(): Promise<void> {
    const spinner = ora('Checking server health...').start();
    
    const healthPromises = Array.from(this.results.entries())
      .filter(([_, result]) => result.reachable)
      .map(async ([server, result]) => {
        try {
          const response = await axios.get(`${server}/health`, {
            timeout: this.config.timeout
          });
          
          const health = response.data;
          result.healthy = health.status === 'healthy';
          result.version = health.version;
          
          // Check server configuration
          if (health.threshold) {
            result.thresholdStatus = health.threshold;
          }
          
          // Warnings
          if (health.uptime < 3600) {
            result.warnings.push('Server recently restarted');
          }
          
          if (health.memory_usage > 80) {
            result.warnings.push(`High memory usage: ${health.memory_usage}%`);
          }
          
          if (health.error_rate > 1) {
            result.warnings.push(`Elevated error rate: ${health.error_rate}%`);
          }
        } catch (error: any) {
          result.healthy = false;
          result.errors.push(`Health check failed: ${error.message}`);
        }
      });
    
    await Promise.all(healthPromises);
    
    const healthyCount = Array.from(this.results.values())
      .filter(r => r.healthy).length;
    
    if (healthyCount === this.config.servers.length) {
      spinner.succeed(`All servers are healthy`);
    } else {
      spinner.warn(`${healthyCount}/${this.config.servers.length} servers are healthy`);
    }
  }
  
  /**
   * Test threshold status
   */
  private async testThresholdStatus(): Promise<void> {
    const spinner = ora('Verifying threshold configuration...').start();
    
    try {
      // Get threshold configuration from first healthy server
      const healthyServer = Array.from(this.results.entries())
        .find(([_, result]) => result.healthy);
      
      if (!healthyServer) {
        spinner.fail('No healthy servers available for threshold check');
        return;
      }
      
      const [serverUrl] = healthyServer;
      const response = await axios.get(`${serverUrl}/threshold/status`);
      const thresholdStatus = response.data;
      
      const diagnostic: ThresholdDiagnostic = {
        configured: {
          k: thresholdStatus.threshold_k,
          n: thresholdStatus.threshold_n
        },
        actual: {
          available: thresholdStatus.available_servers,
          healthy: thresholdStatus.healthy_servers
        },
        status: 'healthy',
        missingServers: [],
        recommendations: []
      };
      
      // Determine status
      if (diagnostic.actual.healthy < diagnostic.configured.k) {
        diagnostic.status = 'critical';
        diagnostic.recommendations.push(
          `Need at least ${diagnostic.configured.k} healthy servers, but only ${diagnostic.actual.healthy} available`
        );
      } else if (diagnostic.actual.healthy < diagnostic.configured.n) {
        diagnostic.status = 'degraded';
        diagnostic.recommendations.push(
          `Operating in degraded mode: ${diagnostic.actual.healthy}/${diagnostic.configured.n} servers`
        );
      }
      
      // Find missing servers
      if (thresholdStatus.expected_servers) {
        diagnostic.missingServers = thresholdStatus.expected_servers
          .filter((s: string) => !this.results.has(s));
      }
      
      // Display result
      if (diagnostic.status === 'healthy') {
        spinner.succeed(`Threshold configuration OK: ${diagnostic.configured.k}-of-${diagnostic.configured.n} (${diagnostic.actual.healthy} available)`);
      } else if (diagnostic.status === 'degraded') {
        spinner.warn(`Threshold degraded: ${diagnostic.actual.healthy}/${diagnostic.configured.n} servers available`);
      } else {
        spinner.fail(`Threshold critical: Only ${diagnostic.actual.healthy} servers available, need ${diagnostic.configured.k}`);
      }
      
      // Store for report
      (this as any).thresholdDiagnostic = diagnostic;
      
    } catch (error: any) {
      spinner.fail(`Threshold check failed: ${error.message}`);
    }
  }
  
  /**
   * Test contract verification
   */
  private async testContractVerification(): Promise<void> {
    const spinner = ora('Verifying smart contract...').start();
    
    try {
      // Test contract accessibility
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const contract = new ethers.Contract(
        this.config.contractAddress!,
        ['function neuralock(address,bytes32) view returns (uint8)'],
        provider
      );
      
      // Test function exists
      const testResult = await contract.neuralock(
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      );
      
      spinner.succeed('Smart contract verified and accessible');
    } catch (error: any) {
      spinner.fail(`Contract verification failed: ${error.message}`);
    }
  }
  
  /**
   * Test end-to-end functionality
   */
  private async testEndToEnd(): Promise<void> {
    const spinner = ora('Running end-to-end test...').start();
    
    try {
      const client = new NeuralockClient({
        servers: this.config.servers.filter(s => 
          this.results.get(s)?.healthy
        )
      });
      
      // Create session
      const sessionStart = performance.now();
      await client.createSession();
      const sessionTime = performance.now() - sessionStart;
      
      // Test encryption
      const testData = Buffer.from('Diagnostic test data');
      const encryptStart = performance.now();
      const encrypted = await client.encrypt(testData, 'diagnostic-test');
      const encryptTime = performance.now() - encryptStart;
      
      // Test decryption
      const decryptStart = performance.now();
      const decrypted = await client.decrypt('diagnostic-test');
      const decryptTime = performance.now() - decryptStart;
      
      // Verify data integrity
      if (!testData.equals(decrypted)) {
        throw new Error('Data integrity check failed');
      }
      
      spinner.succeed('End-to-end test passed');
      
      if (this.config.verbose) {
        console.log(chalk.gray(`  Session: ${sessionTime.toFixed(0)}ms`));
        console.log(chalk.gray(`  Encrypt: ${encryptTime.toFixed(0)}ms`));
        console.log(chalk.gray(`  Decrypt: ${decryptTime.toFixed(0)}ms`));
      }
      
    } catch (error: any) {
      spinner.fail(`End-to-end test failed: ${error.message}`);
    }
  }
  
  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    const spinner = ora('Running performance test...').start();
    
    try {
      const iterations = 10;
      const results = {
        session: [] as number[],
        encrypt: [] as number[],
        decrypt: [] as number[]
      };
      
      const client = new NeuralockClient({
        servers: this.config.servers.filter(s => 
          this.results.get(s)?.healthy
        )
      });
      
      for (let i = 0; i < iterations; i++) {
        // Session
        const sessionStart = performance.now();
        await client.createSession();
        results.session.push(performance.now() - sessionStart);
        
        // Encrypt
        const testData = Buffer.from(`Performance test ${i}`);
        const encryptStart = performance.now();
        await client.encrypt(testData, `perf-test-${i}`);
        results.encrypt.push(performance.now() - encryptStart);
        
        // Decrypt
        const decryptStart = performance.now();
        await client.decrypt(`perf-test-${i}`);
        results.decrypt.push(performance.now() - decryptStart);
      }
      
      // Calculate averages
      const avg = {
        session: results.session.reduce((a, b) => a + b) / iterations,
        encrypt: results.encrypt.reduce((a, b) => a + b) / iterations,
        decrypt: results.decrypt.reduce((a, b) => a + b) / iterations
      };
      
      spinner.succeed('Performance test completed');
      
      console.log(chalk.gray(`  Avg Session: ${avg.session.toFixed(0)}ms`));
      console.log(chalk.gray(`  Avg Encrypt: ${avg.encrypt.toFixed(0)}ms`));
      console.log(chalk.gray(`  Avg Decrypt: ${avg.decrypt.toFixed(0)}ms`));
      
      // Performance warnings
      if (avg.session > 200) {
        console.log(chalk.yellow('  ⚠️  Session creation is slow'));
      }
      if (avg.encrypt > 500) {
        console.log(chalk.yellow('  ⚠️  Encryption is slow'));
      }
      if (avg.decrypt > 600) {
        console.log(chalk.yellow('  ⚠️  Decryption is slow'));
      }
      
    } catch (error: any) {
      spinner.fail(`Performance test failed: ${error.message}`);
    }
  }
  
  /**
   * Generate diagnostic report
   */
  private generateReport(): void {
    console.log(chalk.bold.blue('\n📊 Diagnostic Report\n'));
    
    // Server Status Table
    const serverTable = new Table({
      head: ['Server', 'Status', 'Latency', 'Version', 'Issues'],
      style: { head: ['cyan'] }
    });
    
    this.results.forEach((result, server) => {
      const status = result.healthy ? chalk.green('✓ Healthy') : 
                    result.reachable ? chalk.yellow('⚠ Unhealthy') : 
                    chalk.red('✗ Unreachable');
      
      const latency = result.latency ? `${result.latency.toFixed(0)}ms` : '-';
      const version = result.version || '-';
      const issues = [...result.errors.map(e => chalk.red(e)), 
                     ...result.warnings.map(w => chalk.yellow(w))].join('\n') || 
                     chalk.green('None');
      
      serverTable.push([server, status, latency, version, issues]);
    });
    
    console.log(serverTable.toString());
    
    // Threshold Status
    const threshold = (this as any).thresholdDiagnostic;
    if (threshold) {
      console.log(chalk.bold.blue('\n🔐 Threshold Status\n'));
      
      const thresholdTable = new Table();
      thresholdTable.push(
        ['Configuration', `${threshold.configured.k}-of-${threshold.configured.n}`],
        ['Available Servers', threshold.actual.available],
        ['Healthy Servers', threshold.actual.healthy],
        ['Status', threshold.status === 'healthy' ? chalk.green('Healthy') :
                   threshold.status === 'degraded' ? chalk.yellow('Degraded') :
                   chalk.red('Critical')]
      );
      
      console.log(thresholdTable.toString());
      
      if (threshold.recommendations.length > 0) {
        console.log(chalk.bold.yellow('\n💡 Recommendations:\n'));
        threshold.recommendations.forEach((rec: string) => {
          console.log(`  • ${rec}`);
        });
      }
    }
    
    // Overall Health
    console.log(chalk.bold.blue('\n🏥 Overall Health\n'));
    
    const healthyServers = Array.from(this.results.values()).filter(r => r.healthy).length;
    const totalServers = this.config.servers.length;
    const healthPercentage = (healthyServers / totalServers) * 100;
    
    if (healthPercentage === 100) {
      console.log(chalk.green('✅ System is fully operational'));
    } else if (healthPercentage >= 80) {
      console.log(chalk.yellow('⚠️  System is operational with degraded redundancy'));
    } else {
      console.log(chalk.red('❌ System has critical issues'));
    }
    
    console.log(`\nHealthy servers: ${healthyServers}/${totalServers} (${healthPercentage.toFixed(0)}%)`);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const config: DiagnosticConfig = {
    servers: process.env.NEURALOCK_SERVERS?.split(',') || [
      'http://localhost:8001',
      'http://localhost:8002',
      'http://localhost:8003'
    ],
    contractAddress: args.find(a => a.startsWith('--contract='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v'),
    timeout: parseInt(args.find(a => a.startsWith('--timeout='))?.split('=')[1] || '5000')
  };
  
  const diagnostics = new NeuralockDiagnostics(config);
  
  diagnostics.runDiagnostics()
    .then(() => {
      console.log(chalk.bold.green('\n✅ Diagnostics completed\n'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('\n❌ Diagnostics failed:'), error);
      process.exit(1);
    });
}