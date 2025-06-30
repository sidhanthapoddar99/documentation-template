import React, { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';

interface AddServerModalProps {
  onSuccess: (tokenId: number) => void;
  onClose: () => void;
}

export function AddServerModal({ onSuccess, onClose }: AddServerModalProps) {
  const { registry } = useContract();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    recipient: '',
    serverName: '',
    description: '',
    location: '',
    
    // Step 2: Cryptographic Keys
    serverPublicKey: '',
    encryptionPublicKey: '',
    proofMessage: '',
    proofSignature: '',
    
    // Step 3: Domain Configuration
    domain: '',
    useSSL: true,
    healthCheckEndpoint: '/health',
    apiVersion: 'v1',
    
    // Step 4: Review (computed)
    estimatedGas: null as bigint | null,
  });
  
  // Validation functions
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return (
          formData.recipient.length === 42 &&
          formData.recipient.startsWith('0x') &&
          formData.serverName.length > 0
        );
        
      case 1: // Keys
        return (
          formData.serverPublicKey.length === 66 &&
          formData.encryptionPublicKey.length === 66 &&
          formData.proofSignature.length > 0
        );
        
      case 2: // Domain
        return (
          formData.domain.length > 0 &&
          formData.healthCheckEndpoint.length > 0
        );
        
      default:
        return true;
    }
  };
  
  // Handle form updates
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  // Test server connectivity
  const testServerConnection = async () => {
    try {
      const protocol = formData.useSSL ? 'https' : 'http';
      const url = `${protocol}://${formData.domain}${formData.healthCheckEndpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      toast({
        title: "Connection Successful",
        description: "Server is reachable and responding correctly",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Estimate gas for transaction
  const estimateGas = async () => {
    try {
      const gas = await registry.estimateGas.registerServer(
        formData.recipient,
        {
          serverPublicKey: formData.serverPublicKey,
          encryptionPublicKey: formData.encryptionPublicKey,
          domain: formData.domain,
          healthCheckEndpoint: formData.healthCheckEndpoint,
        }
      );
      
      updateFormData({ estimatedGas: gas });
    } catch (error) {
      console.error('Gas estimation failed:', error);
    }
  };
  
  // Submit registration
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Final validation
      if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
        throw new Error('Please complete all required fields');
      }
      
      // Test connection one more time
      const isConnected = await testServerConnection();
      if (!isConnected) {
        throw new Error('Server connection test failed');
      }
      
      // Submit transaction
      const tx = await registry.registerServer(
        formData.recipient,
        {
          serverPublicKey: formData.serverPublicKey,
          encryptionPublicKey: formData.encryptionPublicKey,
          domain: formData.domain,
          healthCheckEndpoint: formData.healthCheckEndpoint,
        }
      );
      
      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${tx.hash}`,
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const event = receipt.events?.find(e => e.event === 'ServerRegistered');
      const tokenId = event?.args?.tokenId;
      
      toast({
        title: "Server Registered!",
        description: `Server NFT #${tokenId} has been minted`,
      });
      
      onSuccess(tokenId);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={formData.recipient}
                onChange={(e) => updateFormData({ recipient: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                placeholder="My Neuralock Server"
                value={formData.serverName}
                onChange={(e) => updateFormData({ serverName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="High-performance server in US-East"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
              />
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="serverPublicKey">Server Public Key</Label>
              <Input
                id="serverPublicKey"
                placeholder="0x04..."
                value={formData.serverPublicKey}
                onChange={(e) => updateFormData({ serverPublicKey: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="encryptionPublicKey">Encryption Public Key</Label>
              <Input
                id="encryptionPublicKey"
                placeholder="0x04..."
                value={formData.encryptionPublicKey}
                onChange={(e) => updateFormData({ encryptionPublicKey: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="proofSignature">Proof of Ownership Signature</Label>
              <Input
                id="proofSignature"
                placeholder="0x..."
                value={formData.proofSignature}
                onChange={(e) => updateFormData({ proofSignature: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Server Domain</Label>
              <Input
                id="domain"
                placeholder="server.example.com"
                value={formData.domain}
                onChange={(e) => updateFormData({ domain: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="healthCheckEndpoint">Health Check Endpoint</Label>
              <Input
                id="healthCheckEndpoint"
                placeholder="/health"
                value={formData.healthCheckEndpoint}
                onChange={(e) => updateFormData({ healthCheckEndpoint: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={testServerConnection}
              className="w-full"
            >
              Test Connection
            </Button>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Review Registration Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Recipient:</span> {formData.recipient}
              </div>
              <div>
                <span className="font-medium">Server Name:</span> {formData.serverName}
              </div>
              <div>
                <span className="font-medium">Domain:</span> {formData.domain}
              </div>
              <div>
                <span className="font-medium">Estimated Gas:</span>{' '}
                {formData.estimatedGas ? formData.estimatedGas.toString() : 'Calculating...'}
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <Stepper
        currentStep={currentStep}
        steps={[
          'Basic Information',
          'Cryptographic Keys',
          'Domain Configuration',
          'Review & Submit'
        ]}
      />
      
      <div className="min-h-[300px]">
        {renderStep()}
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}
          disabled={isSubmitting}
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        
        <Button
          onClick={() => {
            if (currentStep < 3) {
              if (validateStep(currentStep)) {
                setCurrentStep(currentStep + 1);
                if (currentStep === 2) {
                  estimateGas();
                }
              }
            } else {
              handleSubmit();
            }
          }}
          disabled={!validateStep(currentStep) || isSubmitting}
        >
          {currentStep === 3 ? 'Submit Registration' : 'Next'}
        </Button>
      </div>
    </div>
  );
}