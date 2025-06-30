import { NeuralockClient } from '@neuralock/client';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// Healthcare-specific Neuralock configuration
const neuralockClient = new NeuralockClient({
  applicationContract: process.env.HEALTHCARE_CONTRACT,
  signer: getHealthcareWallet(),
  servers: [
    { nftId: 1, importanceFactor: 1.0, required: true }, // Primary healthcare server
    { nftId: 2, importanceFactor: 0.9 },                 // Secondary
    { nftId: 3, importanceFactor: 0.8 },                 // Tertiary
    { nftId: 4, importanceFactor: 0.7 }                  // Backup
  ],
  options: {
    threshold: {
      mode: 'flexible',
      minimum: 3,      // HIPAA compliance requires high availability
      tolerance: 0.1   // Low tolerance for healthcare data
    },
    ttl: 3600,        // 1 hour sessions
    auditEnabled: true // Enable audit logging
  }
});

// Patient record structure
class PatientRecord {
  constructor(data) {
    this.patientId = data.patientId || uuidv4();
    this.personalInfo = data.personalInfo;
    this.medicalHistory = data.medicalHistory;
    this.medications = data.medications;
    this.allergies = data.allergies;
    this.vitals = data.vitals;
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }
}

// Healthcare service with field-level encryption
class HealthcareService {
  constructor(client) {
    this.client = client;
    this.auditLog = new AuditLogger();
  }

  async createPatientRecord(patientData, doctorId) {
    const record = new PatientRecord(patientData);
    
    // Encrypt different fields with different object IDs for granular access
    const encryptedFields = {
      personalInfo: await this.encryptField(
        record.personalInfo,
        `patient:${record.patientId}:personal`,
        doctorId
      ),
      medicalHistory: await this.encryptField(
        record.medicalHistory,
        `patient:${record.patientId}:history`,
        doctorId
      ),
      medications: await this.encryptField(
        record.medications,
        `patient:${record.patientId}:medications`,
        doctorId
      ),
      allergies: await this.encryptField(
        record.allergies,
        `patient:${record.patientId}:allergies`,
        doctorId
      ),
      vitals: await this.encryptField(
        record.vitals,
        `patient:${record.patientId}:vitals`,
        doctorId
      ),
      notes: await this.encryptField(
        record.notes,
        `patient:${record.patientId}:notes`,
        doctorId
      )
    };

    // Store encrypted record
    const storedRecord = {
      patientId: record.patientId,
      encryptedFields,
      metadata: {
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: doctorId
      }
    };

    await this.storeRecord(storedRecord);
    
    // Audit log
    await this.auditLog.log({
      action: 'CREATE_PATIENT_RECORD',
      patientId: record.patientId,
      userId: doctorId,
      timestamp: new Date()
    });

    return record.patientId;
  }

  async getPatientRecord(patientId, requesterId, requesterRole) {
    // Fetch encrypted record
    const encryptedRecord = await this.fetchRecord(patientId);
    
    if (!encryptedRecord) {
      throw new Error('Patient record not found');
    }

    // Check permissions and decrypt fields based on role
    const decryptedFields = {};
    
    // Doctors can access all fields
    if (requesterRole === 'doctor') {
      for (const [field, encrypted] of Object.entries(encryptedRecord.encryptedFields)) {
        try {
          decryptedFields[field] = await this.decryptField(
            encrypted,
            `patient:${patientId}:${field}`,
            requesterId
          );
        } catch (error) {
          console.error(`Failed to decrypt ${field}:`, error);
          decryptedFields[field] = null;
        }
      }
    }
    
    // Nurses can access limited fields
    else if (requesterRole === 'nurse') {
      const allowedFields = ['vitals', 'medications', 'allergies'];
      for (const field of allowedFields) {
        if (encryptedRecord.encryptedFields[field]) {
          try {
            decryptedFields[field] = await this.decryptField(
              encryptedRecord.encryptedFields[field],
              `patient:${patientId}:${field}`,
              requesterId
            );
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            decryptedFields[field] = null;
          }
        }
      }
    }
    
    // Patients can only access their own basic info
    else if (requesterRole === 'patient' && requesterId === patientId) {
      const allowedFields = ['personalInfo', 'medications', 'allergies'];
      for (const field of allowedFields) {
        if (encryptedRecord.encryptedFields[field]) {
          try {
            decryptedFields[field] = await this.decryptField(
              encryptedRecord.encryptedFields[field],
              `patient:${patientId}:${field}`,
              requesterId
            );
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            decryptedFields[field] = null;
          }
        }
      }
    }

    // Audit log
    await this.auditLog.log({
      action: 'ACCESS_PATIENT_RECORD',
      patientId: patientId,
      userId: requesterId,
      role: requesterRole,
      fieldsAccessed: Object.keys(decryptedFields),
      timestamp: new Date()
    });

    return {
      patientId: patientId,
      ...decryptedFields,
      metadata: encryptedRecord.metadata
    };
  }

  async updatePatientField(patientId, fieldName, newValue, doctorId) {
    // Validate field name
    const allowedFields = ['vitals', 'medications', 'notes', 'allergies'];
    if (!allowedFields.includes(fieldName)) {
      throw new Error('Cannot update this field');
    }

    // Encrypt new value
    const encrypted = await this.encryptField(
      newValue,
      `patient:${patientId}:${fieldName}`,
      doctorId
    );

    // Update record
    await this.updateRecord(patientId, fieldName, encrypted);

    // Audit log
    await this.auditLog.log({
      action: 'UPDATE_PATIENT_FIELD',
      patientId: patientId,
      field: fieldName,
      userId: doctorId,
      timestamp: new Date()
    });
  }

  async grantEmergencyAccess(patientId, emergencyDoctorId, duration = 3600) {
    // Grant temporary access to all patient fields
    const fields = ['personal', 'history', 'medications', 'allergies', 'vitals', 'notes'];
    
    for (const field of fields) {
      await this.client.updatePermissions(
        `patient:${patientId}:${field}`,
        {
          add: {
            [emergencyDoctorId]: ['read'],
            expiresAt: new Date(Date.now() + duration * 1000)
          }
        }
      );
    }

    // Audit log with special emergency flag
    await this.auditLog.log({
      action: 'EMERGENCY_ACCESS_GRANTED',
      patientId: patientId,
      grantedTo: emergencyDoctorId,
      duration: duration,
      timestamp: new Date(),
      emergency: true
    });
  }

  // Helper methods
  async encryptField(data, objectId, userId) {
    const serialized = JSON.stringify(data);
    return await this.client.encrypt(serialized, objectId);
  }

  async decryptField(encrypted, objectId, userId) {
    const decrypted = await this.client.decrypt(encrypted, objectId);
    return JSON.parse(decrypted);
  }

  async storeRecord(record) {
    // Store in your database
    // Implementation depends on your database choice
  }

  async fetchRecord(patientId) {
    // Fetch from your database
    // Implementation depends on your database choice
  }

  async updateRecord(patientId, fieldName, encryptedValue) {
    // Update in your database
    // Implementation depends on your database choice
  }
}

// Express API endpoints
const app = express();
app.use(express.json());

const healthcareService = new HealthcareService(neuralockClient);

// Middleware for authentication and role checking
const authenticate = async (req, res, next) => {
  // Implement your authentication logic
  req.user = {
    id: req.headers['user-id'],
    role: req.headers['user-role']
  };
  next();
};

// Initialize Neuralock on startup
app.listen(3000, async () => {
  await neuralockClient.initialize();
  console.log('Healthcare API running on port 3000');
});

// Create patient record
app.post('/patients', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can create patient records' });
    }

    const patientId = await healthcareService.createPatientRecord(
      req.body,
      req.user.id
    );

    res.json({ patientId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient record
app.get('/patients/:id', authenticate, async (req, res) => {
  try {
    const record = await healthcareService.getPatientRecord(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient field
app.patch('/patients/:id/:field', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'nurse') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await healthcareService.updatePatientField(
      req.params.id,
      req.params.field,
      req.body.value,
      req.user.id
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emergency access
app.post('/emergency/access/:patientId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can grant emergency access' });
    }

    await healthcareService.grantEmergencyAccess(
      req.params.patientId,
      req.body.doctorId,
      req.body.duration
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit log viewer
app.get('/audit-log', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view audit logs' });
    }

    const logs = await healthcareService.auditLog.getLogs(req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple audit logger
class AuditLogger {
  constructor() {
    this.logs = [];
  }

  async log(entry) {
    this.logs.push(entry);
    // In production, store in database or dedicated audit service
    console.log('AUDIT:', entry);
  }

  async getLogs(filters = {}) {
    let filtered = this.logs;
    
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    
    if (filters.patientId) {
      filtered = filtered.filter(log => log.patientId === filters.patientId);
    }
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filtered = filtered.filter(log => new Date(log.timestamp) <= end);
    }
    
    return filtered;
  }
}