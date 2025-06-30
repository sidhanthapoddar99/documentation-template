import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';
import * as readline from 'readline';
import chalk from 'chalk';

interface DebugConfig {
  servers: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  captureTraffic: boolean;
  breakpoints: string[];
}

export class NeuralockDebugger extends EventEmitter {
  private config: DebugConfig;
  private connections: Map<string, WebSocket> = new Map();
  private traffic: TrafficLog[] = [];
  private breakpoints: Set<string> = new Set();
  private paused: boolean = false;
  
  constructor(config: DebugConfig) {
    super();
    this.config = config;
    this.breakpoints = new Set(config.breakpoints);
  }
  
  /**
   * Start interactive debugging session
   */
  async startDebugSession(): Promise<void> {
    console.log(chalk.bold.cyan('🐛 Neuralock Interactive Debugger\n'));
    
    // Connect to servers
    await this.connectToServers();
    
    // Start REPL
    this.startREPL();
    
    // Start traffic capture if enabled
    if (this.config.captureTraffic) {
      this.startTrafficCapture();
    }
  }
  
  /**
   * Connect to debug endpoints
   */
  private async connectToServers(): Promise<void> {
    console.log('Connecting to debug endpoints...\n');
    
    for (const server of this.config.servers) {
      try {
        const wsUrl = server.replace('http', 'ws') + '/debug';
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', () => {
          console.log(chalk.green(`✓ Connected to ${server}`));
          this.connections.set(server, ws);
        });
        
        ws.on('message', (data) => {
          this.handleDebugMessage(server, data.toString());
        });
        
        ws.on('error', (error) => {
          console.error(chalk.red(`✗ Failed to connect to ${server}: ${error.message}`));
        });
        
        await new Promise(resolve => ws.once('open', resolve));
      } catch (error) {
        console.error(chalk.red(`Error connecting to ${server}:`, error));
      }
    }
  }
  
  /**
   * Handle debug messages from servers
   */
  private handleDebugMessage(server: string, message: string): void {
    try {
      const data = JSON.parse(message);
      
      // Check breakpoints
      if (this.breakpoints.has(data.type) || this.breakpoints.has(data.function)) {
        this.paused = true;
        console.log(chalk.yellow(`\n⏸️  Breakpoint hit: ${data.type || data.function}`));
        console.log(chalk.gray(`Server: ${server}`));
        console.log(chalk.gray(`Data: ${JSON.stringify(data, null, 2)}`));
        this.showDebugPrompt();
      }
      
      // Log based on level
      this.logDebugMessage(data);
      
      // Capture traffic
      if (this.config.captureTraffic) {
        this.traffic.push({
          timestamp: Date.now(),
          server,
          data
        });
      }
      
    } catch (error) {
      console.error('Failed to parse debug message:', error);
    }
  }
  
  /**
   * Start interactive REPL
   */
  private startREPL(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('debug> ')
    });
    
    console.log(chalk.gray('\nType "help" for available commands\n'));
    rl.prompt();
    
    rl.on('line', async (line) => {
      const [command, ...args] = line.trim().split(' ');
      
      try {
        await this.executeCommand(command, args);
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      
      if (!this.paused) {
        rl.prompt();
      }
    });
  }
  
  /**
   * Execute debug command
   */
  private async executeCommand(command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'help':
        this.showHelp();
        break;
        
      case 'status':
        await this.showStatus();
        break;
        
      case 'servers':
        this.listServers();
        break;
        
      case 'traffic':
        this.showTraffic(parseInt(args[0]) || 10);
        break;
        
      case 'break':
      case 'b':
        this.setBreakpoint(args[0]);
        break;
        
      case 'clear':
        this.clearBreakpoint(args[0]);
        break;
        
      case 'continue':
      case 'c':
        this.continue();
        break;
        
      case 'step':
      case 's':
        this.step();
        break;
        
      case 'inspect':
      case 'i':
        await this.inspect(args[0], args[1]);
        break;
        
      case 'trace':
        await this.traceRequest(args.join(' '));
        break;
        
      case 'perf':
        await this.showPerformance();
        break;
        
      case 'logs':
        await this.showLogs(args[0], parseInt(args[1]) || 100);
        break;
        
      case 'exec':
        await this.executeRemote(args.join(' '));
        break;
        
      case 'exit':
      case 'quit':
        process.exit(0);
        
      default:
        console.log(chalk.yellow(`Unknown command: ${command}`));
    }
  }
  
  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.bold('\nAvailable Commands:\n'));
    
    const commands = [
      ['help', 'Show this help message'],
      ['status', 'Show system status'],
      ['servers', 'List connected servers'],
      ['traffic [n]', 'Show last n traffic logs'],
      ['break <point>', 'Set breakpoint'],
      ['clear <point>', 'Clear breakpoint'],
      ['continue', 'Continue execution'],
      ['step', 'Step to next operation'],
      ['inspect <server> <path>', 'Inspect server state'],
      ['trace <request>', 'Trace request through system'],
      ['perf', 'Show performance metrics'],
      ['logs <server> [n]', 'Show server logs'],
      ['exec <command>', 'Execute remote command'],
      ['exit', 'Exit debugger']
    ];
    
    commands.forEach(([cmd, desc]) => {
      console.log(`  ${chalk.cyan(cmd.padEnd(20))} ${desc}`);
    });
    
    console.log('');
  }
  
  /**
   * Show system status
   */
  private async showStatus(): Promise<void> {
    console.log(chalk.bold('\n📊 System Status\n'));
    
    for (const [server, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: 'status' }));
        
        const response = await new Promise<any>(resolve => {
          ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        console.log(chalk.bold(`${server}:`));
        console.log(`  Status: ${response.healthy ? chalk.green('Healthy') : chalk.red('Unhealthy')}`);
        console.log(`  Uptime: ${this.formatUptime(response.uptime)}`);
        console.log(`  Memory: ${response.memory.used}MB / ${response.memory.total}MB`);
        console.log(`  CPU: ${response.cpu}%`);
        console.log(`  Active Sessions: ${response.sessions}`);
        console.log(`  Request Rate: ${response.requestRate} req/s`);
        console.log('');
      }
    }
  }
  
  /**
   * Trace request through system
   */
  private async traceRequest(requestId: string): Promise<void> {
    console.log(chalk.bold(`\n🔍 Tracing request: ${requestId}\n`));
    
    const traces: any[] = [];
    
    // Request trace from all servers
    for (const [server, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          command: 'trace', 
          requestId 
        }));
        
        const response = await new Promise<any>(resolve => {
          ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        if (response.traces && response.traces.length > 0) {
          traces.push(...response.traces.map((t: any) => ({
            ...t,
            server
          })));
        }
      }
    }
    
    // Sort by timestamp
    traces.sort((a, b) => a.timestamp - b.timestamp);
    
    // Display trace
    if (traces.length === 0) {
      console.log(chalk.yellow('No traces found for this request'));
    } else {
      traces.forEach((trace, index) => {
        const time = new Date(trace.timestamp).toISOString();
        console.log(`${chalk.gray(time)} ${chalk.cyan(trace.server)}`);
        console.log(`  ${trace.operation} ${trace.duration ? `(${trace.duration}ms)` : ''}`);
        if (trace.error) {
          console.log(chalk.red(`  Error: ${trace.error}`));
        }
        if (trace.data) {
          console.log(chalk.gray(`  Data: ${JSON.stringify(trace.data)}`));
        }
      });
    }
  }
  
  /**
   * Show performance metrics
   */
  private async showPerformance(): Promise<void> {
    console.log(chalk.bold('\n⚡ Performance Metrics\n'));
    
    for (const [server, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: 'metrics' }));
        
        const metrics = await new Promise<any>(resolve => {
          ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        console.log(chalk.bold(`${server}:`));
        console.log('  Response Times:');
        console.log(`    p50: ${metrics.latency.p50}ms`);
        console.log(`    p95: ${metrics.latency.p95}ms`);
        console.log(`    p99: ${metrics.latency.p99}ms`);
        console.log('  Throughput:');
        console.log(`    Requests: ${metrics.throughput.requests}/s`);
        console.log(`    Bytes In: ${this.formatBytes(metrics.throughput.bytesIn)}/s`);
        console.log(`    Bytes Out: ${this.formatBytes(metrics.throughput.bytesOut)}/s`);
        console.log('  Errors:');
        console.log(`    Rate: ${metrics.errors.rate}%`);
        console.log(`    Total: ${metrics.errors.total}`);
        console.log('');
      }
    }
  }
  
  /**
   * Inspect server state
   */
  private async inspect(serverUrl: string, path: string): Promise<void> {
    const ws = this.connections.get(serverUrl);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log(chalk.red(`Not connected to ${serverUrl}`));
      return;
    }
    
    ws.send(JSON.stringify({ 
      command: 'inspect', 
      path 
    }));
    
    const response = await new Promise<any>(resolve => {
      ws.once('message', (data) => resolve(JSON.parse(data.toString())));
    });
    
    console.log(chalk.bold(`\n🔍 ${serverUrl} - ${path}\n`));
    console.log(JSON.stringify(response.data, null, 2));
  }
  
  /**
   * Execute remote command
   */
  private async executeRemote(command: string): Promise<void> {
    console.log(chalk.bold(`\n⚡ Executing: ${command}\n`));
    
    for (const [server, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          command: 'exec', 
          exec: command 
        }));
        
        const response = await new Promise<any>(resolve => {
          ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        console.log(chalk.bold(`${server}:`));
        if (response.success) {
          console.log(chalk.green('  ✓ Success'));
          if (response.result) {
            console.log(`  Result: ${JSON.stringify(response.result)}`);
          }
        } else {
          console.log(chalk.red(`  ✗ Failed: ${response.error}`));
        }
        console.log('');
      }
    }
  }
  
  /**
   * Permission debugging
   */
  async debugPermissions(
    contractAddress: string,
    userAddress: string,
    objectId: string
  ): Promise<void> {
    console.log(chalk.bold('\n🔐 Permission Debugging\n'));
    
    // Check on-chain permissions
    console.log('Checking blockchain permissions...');
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      ['function neuralock(address,bytes32) view returns (uint8)'],
      provider
    );
    
    const permission = await contract.neuralock(userAddress, objectId);
    console.log(`  Permission level: ${permission}`);
    console.log(`  Can read: ${permission >= 1 ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`  Can write: ${permission >= 2 ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`  Is owner: ${permission === 3 ? chalk.green('Yes') : chalk.red('No')}`);
    
    // Check server-side cache
    console.log('\nChecking server cache...');
    for (const [server, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          command: 'checkPermission',
          contractAddress,
          userAddress,
          objectId
        }));
        
        const response = await new Promise<any>(resolve => {
          ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        console.log(`  ${server}:`);
        console.log(`    Cached: ${response.cached ? 'Yes' : 'No'}`);
        console.log(`    Permission: ${response.permission}`);
        console.log(`    TTL: ${response.ttl}s`);
      }
    }
  }
  
  // Helper methods
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
  
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
    return `${(bytes / 1073741824).toFixed(1)}GB`;
  }
  
  private logDebugMessage(data: any): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(data.level || 'info');
    
    if (messageLevel >= configLevel) {
      const color = data.level === 'error' ? chalk.red :
                   data.level === 'warn' ? chalk.yellow :
                   data.level === 'debug' ? chalk.gray :
                   chalk.white;
      
      console.log(color(`[${data.level?.toUpperCase() || 'INFO'}] ${data.message}`));
    }
  }
  
  private showDebugPrompt(): void {
    process.stdout.write(chalk.yellow('debug (paused)> '));
  }
  
  private setBreakpoint(point: string): void {
    this.breakpoints.add(point);
    console.log(chalk.green(`✓ Breakpoint set: ${point}`));
  }
  
  private clearBreakpoint(point: string): void {
    if (point) {
      this.breakpoints.delete(point);
      console.log(chalk.green(`✓ Breakpoint cleared: ${point}`));
    } else {
      this.breakpoints.clear();
      console.log(chalk.green('✓ All breakpoints cleared'));
    }
  }
  
  private continue(): void {
    this.paused = false;
    console.log(chalk.green('▶️  Continuing...'));
  }
  
  private step(): void {
    // Send step command to servers
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: 'step' }));
      }
    });
    console.log(chalk.green('⏭️  Stepping...'));
  }
  
  private listServers(): void {
    console.log(chalk.bold('\n🖥️  Connected Servers:\n'));
    this.connections.forEach((ws, server) => {
      const status = ws.readyState === WebSocket.OPEN ? 
        chalk.green('Connected') : chalk.red('Disconnected');
      console.log(`  ${server} - ${status}`);
    });
  }
  
  private showTraffic(count: number): void {
    console.log(chalk.bold(`\n📡 Last ${count} Traffic Logs:\n`));
    
    const recent = this.traffic.slice(-count);
    recent.forEach(log => {
      const time = new Date(log.timestamp).toISOString();
      console.log(`${chalk.gray(time)} ${chalk.cyan(log.server)}`);
      console.log(`  ${JSON.stringify(log.data)}`);
    });
  }
  
  private async showLogs(server: string, lines: number): Promise<void> {
    const ws = this.connections.get(server);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log(chalk.red(`Not connected to ${server}`));
      return;
    }
    
    ws.send(JSON.stringify({ 
      command: 'logs', 
      lines 
    }));
    
    const response = await new Promise<any>(resolve => {
      ws.once('message', (data) => resolve(JSON.parse(data.toString())));
    });
    
    console.log(chalk.bold(`\n📜 ${server} - Last ${lines} logs:\n`));
    response.logs.forEach((log: string) => {
      console.log(log);
    });
  }
}

interface TrafficLog {
  timestamp: number;
  server: string;
  data: any;
}

// Usage
export function startDebugger(): void {
  const debugger = new NeuralockDebugger({
    servers: process.env.NEURALOCK_SERVERS?.split(',') || [
      'http://localhost:8001',
      'http://localhost:8002',
      'http://localhost:8003'
    ],
    logLevel: 'debug',
    captureTraffic: true,
    breakpoints: ['encrypt', 'decrypt', 'error']
  });
  
  debugger.startDebugSession().catch(console.error);
}