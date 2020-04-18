import * as cdk from '@aws-cdk/core';
import { Stack, RemovalPolicy } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket';

export class Mgt410SSMInventoryBucketStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ssmInventoryBucket = new AutoDeleteBucket(this, 'SSMInventoryBucket', {
      bucketName: 'mgt412-ssm-inventory-bucket-' + Stack.of(this).account + '-' + Stack.of(this).region,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const statementBucketPermissionCheck = new iam.PolicyStatement(
      {
          sid: 'SSMBucketPermissionsCheck',
          effect: iam.Effect.ALLOW,
          actions: [
              's3:GetBucketAcl'
          ],
          resources: [
              'arn:aws:s3:::' + ssmInventoryBucket.bucketName
          ]
      }
    );
    statementBucketPermissionCheck.addServicePrincipal("ssm.amazonaws.com");
    ssmInventoryBucket.addToResourcePolicy(statementBucketPermissionCheck);

    const statementBucketDelivery = new iam.PolicyStatement(
      {
          sid: 'SSMBucketDelivery',
          effect: iam.Effect.ALLOW,
          actions: [
              's3:PutObject'
          ],
          resources: [
              'arn:aws:s3:::' + ssmInventoryBucket.bucketName + '/*/accountid=' + Stack.of(this).account + '/*'
          ]
      }
    );
    statementBucketDelivery.addServicePrincipal("ssm.amazonaws.com");
    ssmInventoryBucket.addToResourcePolicy(statementBucketDelivery);

    


  }
}