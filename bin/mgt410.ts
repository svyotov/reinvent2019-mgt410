#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Mgt410EC2Stack } from '../lib/mgt410-ec2';
import { Mgt410SSMInventoryBucketStack } from '../lib/mgt410-ssm-inventory-bucket';
import { Mgt410SSMInventoryResourceDataSyncStack } from '../lib/mgt410-inventory-resource-data-sync';

const app = new cdk.App();
new Mgt410EC2Stack(app, 'Mgt410EC2StackIreland', {
    env: {
        region: 'eu-west-1'
    }
});

new Mgt410EC2Stack(app, 'Mgt410EC2StackFrankfurt', {
    env: {
        region: 'eu-central-1'
    }
});

new Mgt410SSMInventoryBucketStack(app, 'Mgt410SSMInventoryBucketStackIreland', {
    env: {
        region: 'eu-west-1'
    }
});

new Mgt410SSMInventoryResourceDataSyncStack(app, 'Mgt410SSMInventoryResourceDataSyncStackIreland', {
    env: {
        region: 'eu-west-1'
    },
    bucketName: 'mgt410-ssm-inventory-bucket-541557961089-eu-west-1',
    bucketRegion: 'eu-west-1'
});

new Mgt410SSMInventoryResourceDataSyncStack(app, 'Mgt410SSMInventoryResourceDataSyncStackFrankfurt', {
    env: {
        region: 'eu-central-1'
    },
    bucketName: 'mgt410-ssm-inventory-bucket-541557961089-eu-west-1',
    bucketRegion: 'eu-west-1'
});