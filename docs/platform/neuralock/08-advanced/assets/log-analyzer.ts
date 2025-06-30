import * as fs from 'fs';
import * as readline from 'readline';
import { parse } from 'date-fns';
import chalk from 'chalk';

interface LogEntry {
  timestamp: Date;
  level: string;
  server?: string;
  message: string;
  metadata?: Record<string, any>;
  raw: string;
}

interface LogPattern {
  name: string;
  pattern: RegExp;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  solution?: string;
}

export class LogAnalyzer {
  private entries: LogEntry[] = [];
  private patterns: LogPattern[] = [
    {
      name: 'Connection Timeout',
      pattern: /ETIMEDOUT|connection timed out/i,
      severity: 'error',
      description: 'Network connectivity issues',
      solution: 'Check network connectivity and firewall rules'
    },
    {
      name: 'Threshold Violation',
      pattern: /threshold not met|insufficient servers/i,
      severity: 'critical',
      description: 'Not enough servers to meet threshold requirements',
      solution: 'Activate backup servers or reduce threshold temporarily'
    },
    {
      name: 'Memory Pressure',
      pattern: /out of memory|heap out of memory|allocation failed/i,
      severity: 'critical',
      description: 'Server running out of memory',
      solution: 'Increase memory allocation or investigate memory leaks'
    },
    {
      name: 'High Latency',
      pattern: /high latency|slow response|timeout warning/i,
      severity: 'warning',
      description: 'Performance degradation detected',
      solution: 'Check server load and optimize queries'
    },
    {
      name: 'Certificate Expiration',
      pattern: /certificate.*expir|cert.*expir/i,
      severity: 'warning',
      description: 'SSL/TLS certificate approaching expiration',
      solution: 'Renew certificates before expiration'
    },
    {
      name: 'Database Connection',
      pattern: /database connection failed|lost connection to database/i,
      severity: 'critical',
      description: 'Database connectivity issues',
      solution: 'Check database server and connection pooling'
    },
    {
      name: 'Rate Limiting',
      pattern: /rate limit|too many requests|throttled/i,
      severity: 'warning',
      description: 'Rate limiting triggered',
      solution: 'Implement request queuing or increase rate limits'
    },
    {
      name: 'Share Corruption',
      pattern: /share.*corrupt|invalid share|checksum mismatch/i,
      severity: 'critical',
      description: 'Data integrity issue detected',
      solution: 'Restore from backup and investigate root cause'
    },
    {
      name: 'Clock Drift',
      pattern: /clock.*drift|time.*sync|ntp.*fail/i,
      severity: 'error',
      description: 'Server time synchronization issues',
      solution: 'Fix NTP configuration and sync server clocks'
    },
    {
      name: 'Permission Denied',
      pattern: /permission denied|access denied|forbidden/i,
      severity: 'error',
      description: 'Access control violation',
      solution: 'Check user permissions and contract configuration'
    }
  ];
  
  /**
   * Analyze log files
   */
  async analyzeLogFile(filePath: string): Promise<void> {
    console.log(chalk.bold.blue(`\n📊 Analyzing log file: ${filePath}\n`));
    
    await this.parseLogFile(filePath);
    
    // Perform various analyses
    this.analyzePatterns();
    this.analyzeErrorFrequency();
    this.analyzeTimeDistribution();
    this.analyzeServerHealth();
    this.identifyAnomalies();
    
    // Generate report
    this.generateReport();
  }
  
  /**
   * Parse log file
   */
  private async parseLogFile(filePath: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      const entry = this.parseLogLine(line);
      if (entry) {
        this.entries.push(entry);
      }
    }
    
    console.log(chalk.green(`✓ Parsed ${this.entries.length} log entries`));
  }
  
  /**
   * Parse individual log line
   */
  private parseLogLine(line: string): LogEntry | null {
    // Common log formats
    const patterns = [
      // JSON format
      /^({.+})$/,
      // Standard format: [TIMESTAMP] [LEVEL] [SERVER] MESSAGE
      /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.+)$/,
      // Syslog format
      /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\w+)\s+(.+)$/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          // JSON format
          if (match[1] && match[1].startsWith('{')) {
            const json = JSON.parse(match[1]);
            return {
              timestamp: new Date(json.timestamp || json.time),
              level: json.level || 'info',
              server: json.server,
              message: json.message || json.msg,
              metadata: json,
              raw: line
            };
          }
          
          // Standard format
          return {
            timestamp: new Date(match[1]),
            level: match[2].toLowerCase(),
            server: match[3],
            message: match[4] || match[3],
            raw: line
          };
        } catch (error) {
          // Failed to parse, skip
        }
      }
    }
    
    return null;
  }
  
  /**
   * Analyze patterns in logs
   */
  private analyzePatterns(): void {
    console.log(chalk.bold('\n🔍 Pattern Analysis:\n'));
    
    const matches = new Map<string, number>();
    const examples = new Map<string, string[]>();
    
    this.entries.forEach(entry => {
      this.patterns.forEach(pattern => {
        if (pattern.pattern.test(entry.message)) {
          matches.set(pattern.name, (matches.get(pattern.name) || 0) + 1);
          
          const exampleList = examples.get(pattern.name) || [];
          if (exampleList.length < 3) {
            exampleList.push(entry.message);
            examples.set(pattern.name, exampleList);
          }
        }
      });
    });
    
    // Sort by frequency
    const sorted = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      console.log(chalk.green('No known issues detected'));
    } else {
      sorted.forEach(([name, count]) => {
        const pattern = this.patterns.find(p => p.name === name)!;
        const color = pattern.severity === 'critical' ? chalk.red :
                     pattern.severity === 'error' ? chalk.yellow :
                     pattern.severity === 'warning' ? chalk.cyan :
                     chalk.white;
        
        console.log(color(`${name}: ${count} occurrences`));
        console.log(chalk.gray(`  ${pattern.description}`));
        if (pattern.solution) {
          console.log(chalk.green(`  Solution: ${pattern.solution}`));
        }
        
        const exampleList = examples.get(name);
        if (exampleList && exampleList.length > 0) {
          console.log(chalk.gray('  Examples:'));
          exampleList.forEach(ex => {
            console.log(chalk.gray(`    - ${ex.substring(0, 80)}...`));
          });
        }
        console.log('');
      });
    }
  }
  
  /**
   * Analyze error frequency
   */
  private analyzeErrorFrequency(): void {
    console.log(chalk.bold('\n📈 Error Frequency Analysis:\n'));
    
    const errorLevels = ['error', 'critical', 'fatal'];
    const errors = this.entries.filter(e => 
      errorLevels.includes(e.level.toLowerCase())
    );
    
    if (errors.length === 0) {
      console.log(chalk.green('No errors found in logs'));
      return;
    }
    
    // Group by time buckets
    const buckets = new Map<string, number>();
    errors.forEach(error => {
      const bucket = this.getTimeBucket(error.timestamp);
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });
    
    // Display histogram
    const maxCount = Math.max(...buckets.values());
    Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([bucket, count]) => {
        const bar = '█'.repeat(Math.floor((count / maxCount) * 40));
        console.log(`${bucket} ${bar} ${count}`);
      });
    
    console.log(`\nTotal errors: ${errors.length}`);
    console.log(`Error rate: ${((errors.length / this.entries.length) * 100).toFixed(2)}%`);
  }
  
  /**
   * Analyze time distribution
   */
  private analyzeTimeDistribution(): void {
    console.log(chalk.bold('\n⏰ Time Distribution:\n'));
    
    if (this.entries.length === 0) return;
    
    const first = this.entries[0].timestamp;
    const last = this.entries[this.entries.length - 1].timestamp;
    const duration = last.getTime() - first.getTime();
    
    console.log(`Time range: ${first.toISOString()} - ${last.toISOString()}`);
    console.log(`Duration: ${this.formatDuration(duration)}`);
    console.log(`Log rate: ${(this.entries.length / (duration / 1000)).toFixed(2)} entries/second`);
    
    // Activity by hour
    const hourly = new Map<number, number>();
    this.entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    });
    
    console.log('\nActivity by hour:');
    for (let hour = 0; hour < 24; hour++) {
      const count = hourly.get(hour) || 0;
      const bar = '█'.repeat(Math.floor((count / Math.max(...hourly.values())) * 20));
      console.log(`${hour.toString().padStart(2, '0')}:00 ${bar} ${count}`);
    }
  }
  
  /**
   * Analyze server health
   */
  private analyzeServerHealth(): void {
    console.log(chalk.bold('\n🏥 Server Health Analysis:\n'));
    
    const serverStats = new Map<string, {
      total: number;
      errors: number;
      warnings: number;
    }>();
    
    this.entries.forEach(entry => {
      if (!entry.server) return;
      
      const stats = serverStats.get(entry.server) || {
        total: 0,
        errors: 0,
        warnings: 0
      };
      
      stats.total++;
      if (['error', 'critical', 'fatal'].includes(entry.level)) {
        stats.errors++;
      } else if (entry.level === 'warn' || entry.level === 'warning') {
        stats.warnings++;
      }
      
      serverStats.set(entry.server, stats);
    });
    
    serverStats.forEach((stats, server) => {
      const errorRate = (stats.errors / stats.total) * 100;
      const health = errorRate < 1 ? chalk.green('Healthy') :
                    errorRate < 5 ? chalk.yellow('Degraded') :
                    chalk.red('Critical');
      
      console.log(`${server}: ${health}`);
      console.log(`  Total entries: ${stats.total}`);
      console.log(`  Errors: ${stats.errors} (${errorRate.toFixed(2)}%)`);
      console.log(`  Warnings: ${stats.warnings}`);
      console.log('');
    });
  }
  
  /**
   * Identify anomalies
   */
  private identifyAnomalies(): void {
    console.log(chalk.bold('\n⚠️  Anomaly Detection:\n'));
    
    const anomalies: string[] = [];
    
    // Sudden spike in errors
    const errorSpikes = this.detectErrorSpikes();
    if (errorSpikes.length > 0) {
      anomalies.push(`Error spikes detected at: ${errorSpikes.join(', ')}`);
    }
    
    // Long gaps in logs
    const gaps = this.detectLogGaps();
    if (gaps.length > 0) {
      anomalies.push(`Log gaps detected: ${gaps.join(', ')}`);
    }
    
    // Unusual patterns
    const unusual = this.detectUnusualPatterns();
    if (unusual.length > 0) {
      anomalies.push(...unusual);
    }
    
    if (anomalies.length === 0) {
      console.log(chalk.green('No anomalies detected'));
    } else {
      anomalies.forEach(anomaly => {
        console.log(chalk.yellow(`• ${anomaly}`));
      });
    }
  }
  
  /**
   * Detect error spikes
   */
  private detectErrorSpikes(): string[] {
    const spikes: string[] = [];
    const windowSize = 60000; // 1 minute windows
    
    const windows = new Map<number, number>();
    this.entries.forEach(entry => {
      if (['error', 'critical', 'fatal'].includes(entry.level)) {
        const window = Math.floor(entry.timestamp.getTime() / windowSize);
        windows.set(window, (windows.get(window) || 0) + 1);
      }
    });
    
    const avgErrors = Array.from(windows.values()).reduce((a, b) => a + b, 0) / windows.size;
    const threshold = avgErrors * 3; // 3x average
    
    windows.forEach((count, window) => {
      if (count > threshold) {
        const time = new Date(window * windowSize);
        spikes.push(time.toISOString());
      }
    });
    
    return spikes;
  }
  
  /**
   * Detect log gaps
   */
  private detectLogGaps(): string[] {
    const gaps: string[] = [];
    const gapThreshold = 300000; // 5 minutes
    
    for (let i = 1; i < this.entries.length; i++) {
      const gap = this.entries[i].timestamp.getTime() - 
                  this.entries[i-1].timestamp.getTime();
      
      if (gap > gapThreshold) {
        gaps.push(`${this.formatDuration(gap)} gap at ${this.entries[i-1].timestamp.toISOString()}`);
      }
    }
    
    return gaps;
  }
  
  /**
   * Detect unusual patterns
   */
  private detectUnusualPatterns(): string[] {
    const patterns: string[] = [];
    
    // Repeated errors
    const messageCount = new Map<string, number>();
    this.entries.forEach(entry => {
      if (['error', 'critical'].includes(entry.level)) {
        const key = entry.message.substring(0, 50);
        messageCount.set(key, (messageCount.get(key) || 0) + 1);
      }
    });
    
    messageCount.forEach((count, message) => {
      if (count > 10) {
        patterns.push(`Repeated error (${count}x): "${message}..."`);
      }
    });
    
    return patterns;
  }
  
  /**
   * Generate summary report
   */
  private generateReport(): void {
    console.log(chalk.bold('\n📋 Summary Report:\n'));
    
    const summary = {
      totalEntries: this.entries.length,
      timeRange: this.entries.length > 0 ? 
        `${this.entries[0].timestamp.toISOString()} - ${this.entries[this.entries.length-1].timestamp.toISOString()}` : 
        'N/A',
      levelDistribution: new Map<string, number>(),
      topErrors: [] as string[]
    };
    
    // Level distribution
    this.entries.forEach(entry => {
      summary.levelDistribution.set(
        entry.level,
        (summary.levelDistribution.get(entry.level) || 0) + 1
      );
    });
    
    // Top errors
    const errorMessages = new Map<string, number>();
    this.entries
      .filter(e => ['error', 'critical'].includes(e.level))
      .forEach(entry => {
        const key = entry.message.substring(0, 100);
        errorMessages.set(key, (errorMessages.get(key) || 0) + 1);
      });
    
    summary.topErrors = Array.from(errorMessages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([msg, count]) => `${msg} (${count}x)`);
    
    // Display summary
    console.log(`Total log entries: ${summary.totalEntries}`);
    console.log(`Time range: ${summary.timeRange}`);
    console.log('\nLog level distribution:');
    summary.levelDistribution.forEach((count, level) => {
      const percentage = ((count / summary.totalEntries) * 100).toFixed(1);
      console.log(`  ${level}: ${count} (${percentage}%)`);
    });
    
    if (summary.topErrors.length > 0) {
      console.log('\nTop errors:');
      summary.topErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
  }
  
  // Helper methods
  private getTimeBucket(timestamp: Date): string {
    const minutes = Math.floor(timestamp.getMinutes() / 10) * 10;
    return `${timestamp.getHours().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new LogAnalyzer();
  const logFile = process.argv[2];
  
  if (!logFile) {
    console.error('Usage: ts-node log-analyzer.ts <logfile>');
    process.exit(1);
  }
  
  analyzer.analyzeLogFile(logFile)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Analysis failed:', error);
      process.exit(1);
    });
}