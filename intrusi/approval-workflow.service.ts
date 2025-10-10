import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class ApprovalWorkflowService {
  /**
   * Ottieni tutti i workflow
   */
  async getAllWorkflows(filters?: any) {
    try {
      const where: any = {};
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive === 'true' || filters.isActive === true;
      }
      
      if (filters?.documentType) {
        where.documentType = filters.documentType;
      }

      const workflows = await prisma.approvalWorkflowConfig.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      });

      return workflows;
    } catch (error) {
      logger.error('Error fetching approval workflows:', error);
      throw error;
    }
  }

  /**
   * Ottieni un workflow per ID
   */
  async getWorkflowById(id: string) {
    try {
      const workflow = await prisma.approvalWorkflowConfig.findUnique({
        where: { id }
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      return workflow;
    } catch (error) {
      logger.error('Error fetching workflow:', error);
      throw error;
    }
  }

  /**
   * Ottieni un workflow per nome
   */
  async getWorkflowByName(name: string) {
    try {
      const workflow = await prisma.approvalWorkflowConfig.findUnique({
        where: { name }
      });

      return workflow;
    } catch (error) {
      logger.error('Error fetching workflow by name:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo workflow
   */
  async createWorkflow(data: any, userId: string) {
    try {
      // Verifica se il nome esiste già
      const existing = await this.getWorkflowByName(data.name);
      if (existing) {
        throw new Error('Workflow with this name already exists');
      }

      // Valida gli steps
      if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error('Workflow must have at least one step');
      }

      // Valida che ogni step abbia i campi richiesti
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        if (!step.name || !step.status || !step.actions || !step.allowedRoles) {
          throw new Error(`Step ${i + 1} is missing required fields`);
        }
      }

      // Se è default, rimuovi il flag da altri workflow dello stesso tipo
      if (data.isDefault) {
        await prisma.approvalWorkflowConfig.updateMany({
          where: {
            documentType: data.documentType,
            isDefault: true
          },
          data: { isDefault: false }
        });
      }

      const workflowData: any = {
        name: data.name,
        description: data.description,
        documentType: data.documentType,
        steps: data.steps,
        notificationConfig: data.notificationConfig || {},
        autoApproveAfterDays: data.autoApproveAfterDays,
        autoPublishAfterApproval: data.autoPublishAfterApproval || false,
        autoArchiveAfterDays: data.autoArchiveAfterDays,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault || false,
        createdBy: userId
      };

      const newWorkflow = await prisma.approvalWorkflowConfig.create({
        data: workflowData
      });

      // Log audit
      await this.logAudit('CREATE', newWorkflow.id, null, newWorkflow, userId);

      return newWorkflow;
    } catch (error: any) {
      logger.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un workflow
   */
  async updateWorkflow(id: string, data: any, userId: string) {
    try {
      const existingWorkflow = await this.getWorkflowById(id);

      // Se sta cambiando il nome, verifica che non esista già
      if (data.name && data.name !== existingWorkflow.name) {
        const duplicate = await this.getWorkflowByName(data.name);
        if (duplicate) {
          throw new Error('Workflow with this name already exists');
        }
      }

      // Valida gli steps se forniti
      if (data.steps) {
        if (!Array.isArray(data.steps) || data.steps.length === 0) {
          throw new Error('Workflow must have at least one step');
        }

        for (let i = 0; i < data.steps.length; i++) {
          const step = data.steps[i];
          if (!step.name || !step.status || !step.actions || !step.allowedRoles) {
            throw new Error(`Step ${i + 1} is missing required fields`);
          }
        }
      }

      // Se diventa default, rimuovi il flag da altri
      if (data.isDefault && !existingWorkflow.isDefault) {
        const docType = data.documentType || existingWorkflow.documentType;
        await prisma.approvalWorkflowConfig.updateMany({
          where: {
            documentType: docType,
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.documentType !== undefined) updateData.documentType = data.documentType;
      if (data.steps !== undefined) updateData.steps = data.steps;
      if (data.notificationConfig !== undefined) updateData.notificationConfig = data.notificationConfig;
      if (data.autoApproveAfterDays !== undefined) updateData.autoApproveAfterDays = data.autoApproveAfterDays;
      if (data.autoPublishAfterApproval !== undefined) updateData.autoPublishAfterApproval = data.autoPublishAfterApproval;
      if (data.autoArchiveAfterDays !== undefined) updateData.autoArchiveAfterDays = data.autoArchiveAfterDays;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

      const updatedWorkflow = await prisma.approvalWorkflowConfig.update({
        where: { id },
        data: updateData
      });

      // Log audit
      await this.logAudit('UPDATE', id, existingWorkflow, updatedWorkflow, userId);

      return updatedWorkflow;
    } catch (error: any) {
      logger.error('Error updating workflow:', error);
      throw error;
    }
  }

  /**
   * Elimina un workflow
   */
  async deleteWorkflow(id: string, userId: string) {
    try {
      const workflow = await this.getWorkflowById(id);

      // Non permettere l'eliminazione del workflow di default
      if (workflow.isDefault) {
        throw new Error('Cannot delete default workflow');
      }

      // Verifica se ci sono documenti che usano questo workflow
      // (Qui potresti aggiungere controlli specifici se necessario)

      await prisma.approvalWorkflowConfig.delete({
        where: { id }
      });

      // Log audit
      await this.logAudit('DELETE', id, workflow, null, userId);

      return { success: true, message: 'Workflow deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * Clona un workflow
   */
  async cloneWorkflow(id: string, newName: string, userId: string) {
    try {
      const sourceWorkflow = await this.getWorkflowById(id);

      // Verifica che il nuovo nome non esista
      const existing = await this.getWorkflowByName(newName);
      if (existing) {
        throw new Error('Workflow with this name already exists');
      }

      const clonedData = {
        name: newName,
        description: `${sourceWorkflow.description || ''} (Cloned)`,
        documentType: sourceWorkflow.documentType,
        steps: sourceWorkflow.steps,
        notificationConfig: sourceWorkflow.notificationConfig,
        autoApproveAfterDays: sourceWorkflow.autoApproveAfterDays,
        autoPublishAfterApproval: sourceWorkflow.autoPublishAfterApproval,
        autoArchiveAfterDays: sourceWorkflow.autoArchiveAfterDays,
        isActive: false, // Clonato come non attivo
        isDefault: false // Clonato come non default
      };

      const clonedWorkflow = await this.createWorkflow(clonedData, userId);

      return clonedWorkflow;
    } catch (error: any) {
      logger.error('Error cloning workflow:', error);
      throw error;
    }
  }

  /**
   * Simula l'esecuzione di un workflow
   */
  async simulateWorkflow(id: string, documentData?: any) {
    try {
      const workflow = await this.getWorkflowById(id);
      
      const simulation: any = {
        workflow: workflow.name,
        documentType: workflow.documentType,
        steps: [],
        estimatedDays: 0,
        notifications: []
      };

      // Simula ogni step
      const steps = workflow.steps as any[];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepSimulation: any = {
          order: step.order || i + 1,
          name: step.name,
          status: step.status,
          allowedRoles: step.allowedRoles,
          actions: step.actions,
          requiresComment: step.requiresComment || false
        };

        // Calcola tempo stimato
        if (i > 0) {
          stepSimulation.estimatedDaysFromPrevious = step.estimatedDays || 1;
          simulation.estimatedDays += stepSimulation.estimatedDaysFromPrevious;
        }

        // Aggiungi notifiche
        if (step.notifyOnEntry) {
          simulation.notifications.push({
            step: step.name,
            type: 'entry',
            recipients: step.allowedRoles
          });
        }
        if (step.notifyOnExit) {
          simulation.notifications.push({
            step: step.name,
            type: 'exit',
            recipients: step.allowedRoles
          });
        }

        simulation.steps.push(stepSimulation);
      }

      // Aggiungi auto-azioni
      if (workflow.autoApproveAfterDays) {
        simulation.autoActions = simulation.autoActions || [];
        simulation.autoActions.push({
          type: 'auto-approve',
          afterDays: workflow.autoApproveAfterDays
        });
        simulation.estimatedDays = Math.min(simulation.estimatedDays, workflow.autoApproveAfterDays);
      }

      if (workflow.autoPublishAfterApproval) {
        simulation.autoActions = simulation.autoActions || [];
        simulation.autoActions.push({
          type: 'auto-publish',
          condition: 'after-approval'
        });
      }

      if (workflow.autoArchiveAfterDays) {
        simulation.autoActions = simulation.autoActions || [];
        simulation.autoActions.push({
          type: 'auto-archive',
          afterDays: workflow.autoArchiveAfterDays
        });
      }

      return simulation;
    } catch (error) {
      logger.error('Error simulating workflow:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche sui workflow
   */
  async getWorkflowStatistics() {
    try {
      const [total, active, withAutoApprove, defaultCount] = await Promise.all([
        prisma.approvalWorkflowConfig.count(),
        prisma.approvalWorkflowConfig.count({ where: { isActive: true } }),
        prisma.approvalWorkflowConfig.count({ where: { autoApproveAfterDays: { not: null } } }),
        prisma.approvalWorkflowConfig.count({ where: { isDefault: true } })
      ]);

      // Conta workflow per tipo documento
      const workflows = await prisma.approvalWorkflowConfig.findMany({
        select: { documentType: true }
      });

      const byDocumentType: any = {};
      workflows.forEach(w => {
        const type = w.documentType || 'All';
        byDocumentType[type] = (byDocumentType[type] || 0) + 1;
      });

      return {
        total,
        active,
        inactive: total - active,
        withAutoApprove,
        defaultCount,
        byDocumentType
      };
    } catch (error) {
      logger.error('Error getting workflow statistics:', error);
      throw error;
    }
  }

  /**
   * Log delle modifiche per audit
   */
  private async logAudit(
    action: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    userId: string
  ) {
    try {
      await prisma.documentConfigAudit.create({
        data: {
          entityType: 'ApprovalWorkflow',
          entityId,
          action,
          oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          userId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging audit:', error);
    }
  }

  /**
   * Inizializza i workflow di default
   */
  async initializeDefaultWorkflows(userId: string) {
    try {
      const defaultWorkflows = [
        {
          name: 'Simple Approval',
          description: 'Workflow semplice con approvazione singola',
          documentType: null, // Per tutti i tipi
          steps: [
            {
              order: 1,
              name: 'Draft',
              status: 'DRAFT',
              actions: ['edit', 'delete', 'submit_review'],
              nextStatus: 'REVIEW',
              allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: false,
              notifyOnExit: true
            },
            {
              order: 2,
              name: 'Review',
              status: 'REVIEW',
              actions: ['approve', 'reject', 'request_changes'],
              nextStatus: 'APPROVED',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: true,
              notifyOnEntry: true,
              notifyOnExit: true,
              estimatedDays: 2
            },
            {
              order: 3,
              name: 'Approved',
              status: 'APPROVED',
              actions: ['publish', 'archive'],
              nextStatus: 'PUBLISHED',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: true,
              notifyOnExit: false
            },
            {
              order: 4,
              name: 'Published',
              status: 'PUBLISHED',
              actions: ['archive', 'create_new_version'],
              nextStatus: null,
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: true,
              notifyOnExit: false
            }
          ],
          isDefault: true,
          isActive: true
        },
        {
          name: 'Quick Publish',
          description: 'Pubblicazione rapida senza approvazione',
          documentType: null,
          steps: [
            {
              order: 1,
              name: 'Draft',
              status: 'DRAFT',
              actions: ['edit', 'delete', 'publish'],
              nextStatus: 'PUBLISHED',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: false,
              notifyOnExit: true
            },
            {
              order: 2,
              name: 'Published',
              status: 'PUBLISHED',
              actions: ['archive', 'create_new_version'],
              nextStatus: null,
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: true,
              notifyOnExit: false
            }
          ],
          isDefault: false,
          isActive: true
        },
        {
          name: 'Multi-Level Approval',
          description: 'Approvazione multi-livello con revisione legale',
          documentType: 'PRIVACY_POLICY',
          steps: [
            {
              order: 1,
              name: 'Draft',
              status: 'DRAFT',
              actions: ['edit', 'delete', 'submit_review'],
              nextStatus: 'ADMIN_REVIEW',
              allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: false,
              notifyOnExit: true
            },
            {
              order: 2,
              name: 'Admin Review',
              status: 'ADMIN_REVIEW',
              actions: ['approve', 'reject', 'request_changes'],
              nextStatus: 'LEGAL_REVIEW',
              allowedRoles: ['ADMIN'],
              requiresComment: true,
              notifyOnEntry: true,
              notifyOnExit: true,
              estimatedDays: 1
            },
            {
              order: 3,
              name: 'Legal Review',
              status: 'LEGAL_REVIEW',
              actions: ['approve', 'reject', 'request_changes'],
              nextStatus: 'FINAL_APPROVAL',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: true,
              notifyOnEntry: true,
              notifyOnExit: true,
              estimatedDays: 3
            },
            {
              order: 4,
              name: 'Final Approval',
              status: 'FINAL_APPROVAL',
              actions: ['approve', 'reject'],
              nextStatus: 'APPROVED',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: true,
              notifyOnEntry: true,
              notifyOnExit: true,
              estimatedDays: 1
            },
            {
              order: 5,
              name: 'Approved',
              status: 'APPROVED',
              actions: ['publish', 'schedule_publish'],
              nextStatus: 'PUBLISHED',
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: true,
              notifyOnExit: true
            },
            {
              order: 6,
              name: 'Published',
              status: 'PUBLISHED',
              actions: ['archive', 'create_new_version'],
              nextStatus: null,
              allowedRoles: ['SUPER_ADMIN'],
              requiresComment: false,
              notifyOnEntry: true,
              notifyOnExit: false
            }
          ],
          autoApproveAfterDays: 7,
          autoPublishAfterApproval: false,
          autoArchiveAfterDays: 365,
          isDefault: false,
          isActive: true
        }
      ];

      const created = [];
      for (const workflowData of defaultWorkflows) {
        const existing = await this.getWorkflowByName(workflowData.name);
        if (!existing) {
          const newWorkflow = await this.createWorkflow(workflowData, userId);
          created.push(newWorkflow);
        }
      }

      return {
        message: `Initialized ${created.length} default workflows`,
        created
      };
    } catch (error) {
      logger.error('Error initializing default workflows:', error);
      throw error;
    }
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
