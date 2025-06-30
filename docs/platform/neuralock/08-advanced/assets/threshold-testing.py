import asyncio
import time
import random
from typing import List, Dict, Tuple
from dataclasses import dataclass
import numpy as np
from neuralock import NeuralockClient, ThresholdConfig

@dataclass
class TestResult:
    """Results from threshold configuration test"""
    threshold_k: int
    threshold_n: int
    success_rate: float
    avg_latency: float
    p95_latency: float
    failure_scenarios: List[str]
    resilience_score: float

class ThresholdTester:
    """Comprehensive testing framework for threshold configurations"""
    
    def __init__(self, servers: List[str], test_duration: int = 300):
        self.servers = servers
        self.test_duration = test_duration
        self.results: List[TestResult] = []
        
    async def test_configuration(
        self, 
        k: int, 
        n: int,
        failure_rate: float = 0.1
    ) -> TestResult:
        """Test a specific threshold configuration"""
        print(f"\nTesting {k}-of-{n} configuration...")
        
        # Configure client with test threshold
        config = ThresholdConfig(
            threshold_k=k,
            threshold_n=n,
            servers=self.servers[:n]
        )
        client = NeuralockClient(config)
        
        # Test metrics
        successes = 0
        failures = 0
        latencies = []
        failure_scenarios = set()
        
        # Run tests
        start_time = time.time()
        while time.time() - start_time < self.test_duration:
            # Simulate server failures
            failed_servers = self._simulate_failures(n, failure_rate)
            
            try:
                # Attempt operation with failures
                operation_start = time.time()
                result = await self._perform_operation(
                    client, 
                    failed_servers
                )
                operation_time = (time.time() - operation_start) * 1000
                
                if result:
                    successes += 1
                    latencies.append(operation_time)
                else:
                    failures += 1
                    failure_scenarios.add(
                        f"Failed with {len(failed_servers)} servers down"
                    )
                    
            except Exception as e:
                failures += 1
                failure_scenarios.add(str(e))
            
            # Small delay between operations
            await asyncio.sleep(0.1)
        
        # Calculate metrics
        success_rate = successes / (successes + failures)
        avg_latency = np.mean(latencies) if latencies else 0
        p95_latency = np.percentile(latencies, 95) if latencies else 0
        resilience_score = self._calculate_resilience(k, n, success_rate)
        
        return TestResult(
            threshold_k=k,
            threshold_n=n,
            success_rate=success_rate,
            avg_latency=avg_latency,
            p95_latency=p95_latency,
            failure_scenarios=list(failure_scenarios),
            resilience_score=resilience_score
        )
    
    def _simulate_failures(self, n: int, failure_rate: float) -> List[int]:
        """Simulate random server failures"""
        num_failures = int(n * failure_rate)
        if random.random() < 0.1:  # 10% chance of cascading failure
            num_failures = min(n - 1, num_failures * 2)
        
        failed_servers = random.sample(range(n), num_failures)
        return failed_servers
    
    async def _perform_operation(
        self, 
        client: NeuralockClient,
        failed_servers: List[int]
    ) -> bool:
        """Perform test operation with simulated failures"""
        # Mock operation - in real test, this would encrypt/decrypt
        available_servers = [
            s for i, s in enumerate(client.servers) 
            if i not in failed_servers
        ]
        
        # Check if we have enough servers
        return len(available_servers) >= client.config.threshold_k
    
    def _calculate_resilience(
        self, 
        k: int, 
        n: int, 
        success_rate: float
    ) -> float:
        """Calculate overall resilience score"""
        redundancy_factor = (n - k) / n
        availability_factor = success_rate
        security_factor = k / n
        
        # Weighted score
        resilience = (
            0.4 * redundancy_factor +
            0.4 * availability_factor +
            0.2 * security_factor
        )
        
        return resilience
    
    async def test_all_configurations(
        self,
        configurations: List[Tuple[int, int]]
    ) -> Dict[str, TestResult]:
        """Test multiple threshold configurations"""
        results = {}
        
        for k, n in configurations:
            result = await self.test_configuration(k, n)
            results[f"{k}-of-{n}"] = result
            self._print_result(result)
        
        return results
    
    def _print_result(self, result: TestResult):
        """Print test result summary"""
        print(f"\n{'='*50}")
        print(f"Configuration: {result.threshold_k}-of-{result.threshold_n}")
        print(f"Success Rate: {result.success_rate:.2%}")
        print(f"Average Latency: {result.avg_latency:.2f}ms")
        print(f"P95 Latency: {result.p95_latency:.2f}ms")
        print(f"Resilience Score: {result.resilience_score:.2f}/1.0")
        if result.failure_scenarios:
            print(f"Failure Scenarios: {', '.join(result.failure_scenarios)}")
        print(f"{'='*50}")
    
    def generate_report(self, results: Dict[str, TestResult]) -> str:
        """Generate comprehensive test report"""
        report = ["# Threshold Configuration Test Report\n"]
        
        # Summary table
        report.append("## Summary\n")
        report.append("| Configuration | Success Rate | Avg Latency | P95 Latency | Resilience |")
        report.append("|---------------|--------------|-------------|-------------|------------|")
        
        for config, result in results.items():
            report.append(
                f"| {config} | {result.success_rate:.2%} | "
                f"{result.avg_latency:.0f}ms | {result.p95_latency:.0f}ms | "
                f"{result.resilience_score:.2f} |"
            )
        
        # Recommendations
        report.append("\n## Recommendations\n")
        best_config = max(
            results.items(), 
            key=lambda x: x[1].resilience_score
        )
        report.append(
            f"- **Best Overall**: {best_config[0]} "
            f"(Resilience: {best_config[1].resilience_score:.2f})"
        )
        
        fastest_config = min(
            results.items(),
            key=lambda x: x[1].avg_latency
        )
        report.append(
            f"- **Fastest**: {fastest_config[0]} "
            f"(Latency: {fastest_config[1].avg_latency:.0f}ms)"
        )
        
        most_reliable = max(
            results.items(),
            key=lambda x: x[1].success_rate
        )
        report.append(
            f"- **Most Reliable**: {most_reliable[0]} "
            f"(Success: {most_reliable[1].success_rate:.2%})"
        )
        
        return "\n".join(report)

# Example usage
async def main():
    # Test servers
    servers = [
        "https://server1.neuralock.io",
        "https://server2.neuralock.io",
        "https://server3.neuralock.io",
        "https://server4.neuralock.io",
        "https://server5.neuralock.io",
        "https://server6.neuralock.io",
        "https://server7.neuralock.io",
        "https://server8.neuralock.io",
        "https://server9.neuralock.io"
    ]
    
    # Initialize tester
    tester = ThresholdTester(servers, test_duration=60)
    
    # Test configurations
    configurations = [
        (1, 1),  # Development
        (2, 3),  # Basic production
        (2, 5),  # Flexible production
        (3, 5),  # High security
        (5, 9),  # Enterprise
    ]
    
    # Run tests
    results = await tester.test_all_configurations(configurations)
    
    # Generate report
    report = tester.generate_report(results)
    print("\n" + report)
    
    # Save report
    with open("threshold-test-report.md", "w") as f:
        f.write(report)

if __name__ == "__main__":
    asyncio.run(main())