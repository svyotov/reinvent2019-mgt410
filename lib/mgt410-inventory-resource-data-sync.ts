import * as cdk from '@aws-cdk/core';
import { Stack, RemovalPolicy, Tag } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import ssm = require('@aws-cdk/aws-ssm');
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket';


export interface Mgt410SSMInventoryResourceDataSyncStackProps extends cdk.StackProps {
    bucketName: string;
    bucketRegion: string;
}

export class Mgt410SSMInventoryResourceDataSyncStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Mgt410SSMInventoryResourceDataSyncStackProps) {
    super(scope, id, props);

    const inventoryAssociation = new ssm.CfnAssociation(this, 'InventoryAssociation', {
        name: "AWS-GatherSoftwareInventory",
        associationName: "Inventory-Association",
        scheduleExpression: "rate(30 minutes)",
        outputLocation: {
            s3Location: {
                outputS3BucketName: props.bucketName,
                outputS3KeyPrefix: ""
            }
        },
        targets: [
            {
                key: "InstanceIds",
                values: ["*"]
            }
        ]
    });
    inventoryAssociation.addOverride('Properties.Parameters.applications', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.awsComponents', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.billingInfo', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.customInventory', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.files', ['']);
    inventoryAssociation.addOverride('Properties.Parameters.instanceDetailedInformation', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.networkConfig', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.services', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.windowsRegistry', ['']);
    inventoryAssociation.addOverride('Properties.Parameters.windowsRoles', ['Enabled']);
    inventoryAssociation.addOverride('Properties.Parameters.windowsUpdates', ['Enabled']);

    const resourceDataSync = new ssm.CfnResourceDataSync(this, 'ResourceDataSync', {
        syncName: 'ssm-resource-data-sync',
        syncType: 'SyncToDestination',
        s3Destination: {
            bucketName: props.bucketName,
            bucketRegion: props.bucketRegion,
            syncFormat: 'JsonSerDe'
        }
    });

    const patchBaselineWindows = new ssm.CfnPatchBaseline(this, 'PatchBaselineWindows', {
        name: 'WindowsCriticalSecurity-PatchBaseline',
        operatingSystem: 'WINDOWS',
        description: 'Baseline containing all updates approved for Windows systems',
        approvedPatchesComplianceLevel: 'CRITICAL',
        approvalRules: {
            patchRules: [
                {
                    patchFilterGroup: {
                        patchFilters: [
                            {
                                key: 'MSRC_SEVERITY',
                                values: ['Critical', 'Important']
                            },
                            {
                                key: 'CLASSIFICATION',
                                values: ['SecurityUpdates', 'CriticalUpdates']
                            },
                        ]
                    },
                    approveAfterDays: 0
                }
            ]
        }
    });

    Tag.add(patchBaselineWindows, 'OS', 'Windows');

    const patchBaselineLinux = new ssm.CfnPatchBaseline(this, 'PatchBaselineLinux', {
        name: 'AmazonLinux2CriticalSecurity-PatchBaseline',
        operatingSystem: 'AMAZON_LINUX_2',
        description: 'Baseline containing all updates approved for Amazon Linux systems',
        approvedPatchesComplianceLevel: 'CRITICAL',
        approvalRules: {
            patchRules: [
                {
                    patchFilterGroup: {
                        patchFilters: [
                            {
                                key: 'PRODUCT',
                                values: ['AmazonLinux2', 'AmazonLinux2.0']
                            },
                            {
                                key: 'SEVERITY',
                                values: ['Critical', 'Important']
                            },
                            {
                                key: 'CLASSIFICATION',
                                values: ['Security']
                            },
                        ]
                    },
                    approveAfterDays: 0,
                    enableNonSecurity: true
                }
            ]
        }
    });

    Tag.add(patchBaselineWindows, 'OS', 'AmazonWindows');

    const maintenanceWindow = new ssm.CfnMaintenanceWindow(this, 'MaintenanceWindow', {
        name: 'Patch-Prod-Mon-8pm',
        allowUnassociatedTargets: false,
        cutoff: 1,
        duration: 4,
        schedule: 'cron(0 0 20 ? * MON *)'
    });
    Tag.add(maintenanceWindow, 'Environment', 'Production')

    const registerTargetWindows = new ssm.CfnMaintenanceWindowTarget(this, 'MaintenanceWindowTargetWindows', {
        name: 'Prod-Windows',
        windowId: maintenanceWindow.ref,
        ownerInformation: 'Production Servers',
        resourceType: 'INSTANCE',
        targets: [
            {
                key: 'tag:Patch Group',
                values: ['Prod-Windows']
            }
        ]
    });

    const registerTargetLinux = new ssm.CfnMaintenanceWindowTarget(this, 'MaintenanceWindowTargetLinux', {
        name: 'Prod-AmazonLinux',
        windowId: maintenanceWindow.ref,
        ownerInformation: 'Production Servers',
        resourceType: 'INSTANCE',
        targets: [
            {
                key: 'tag:Patch Group',
                values: ['Prod-AmazonLinux']
            }
        ]
    });

/*    new ssm.CfnMaintenanceWindowTask(this, '', {
        
    });
    */
  }
}
