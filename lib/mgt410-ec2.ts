import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket';

import logs = require('@aws-cdk/aws-logs');
import { Tag, Stack, RemovalPolicy } from '@aws-cdk/core';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export class Mgt410EC2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC Flow Log Destinations
    const flowlogBucket = new AutoDeleteBucket(this, 'FlowLogBucket', {
        bucketName: 'mgt410-workshop-flowlogs-bucket-' + Stack.of(this).account + '-' + Stack.of(this).region,
        removalPolicy: RemovalPolicy.DESTROY
    });
    Tag.add(flowlogBucket, 'Workload', 'MySuperWorkload');

    const flowlogCWLogGroup = new logs.LogGroup(this, 'FlowlogLogGroup', {
        logGroupName: 'mgt410/vpcflowlogsrejected',
        removalPolicy: RemovalPolicy.DESTROY
    });
    Tag.add(flowlogCWLogGroup, 'Workload', 'MySuperWorkload');

    
    // Create standard VPC
    const vpc = new ec2.Vpc(this, 'Vpc');
    Tag.add(vpc, 'Workload', 'MySuperWorkload');

    // and add VPC Flow Log
    vpc.addFlowLog('FlowLogS3', {
        destination: ec2.FlowLogDestination.toS3(flowlogBucket)
    });
      
    vpc.addFlowLog('FlowLogCloudWatch', {
        trafficType: ec2.FlowLogTrafficType.REJECT,
        destination: ec2.FlowLogDestination.toCloudWatchLogs(flowlogCWLogGroup)
    });

    // Create security group with http access
    const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
        vpc: vpc,
        description: 'Allow http access to ec2 instances from anywhere',
        allowAllOutbound: true
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public http access');
    Tag.add(sg, 'Name', 'SSMTraining');
    Tag.add(sg, 'Workload', 'MySuperWorkload');

    // Create EC2 instance role for SSM managed intances
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
        assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal("ec2.amazonaws.com"),
            new iam.ServicePrincipal("ssm.amazonaws.com"),
        )
    });

    ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));

    const region = Stack.of(this).region;
    ec2Role.addToPolicy(new iam.PolicyStatement({
        actions: [
          's3:GetObject'
        ],
        resources: [
            `arn:aws:s3:::aws-ssm-${region}/*`,
            `arn:aws:s3:::aws-windows-downloads-${region}/*`,
            `arn:aws:s3:::amazon-ssm-${region}/*`,
            `arn:aws:s3:::amazon-ssm-packages-${region}/*`,
            `arn:aws:s3:::${region}-birdwatcher-prod/*`,
            `arn:aws:s3:::patch-baseline-snapshot-${region}/*`,
            ],
    }));
    Tag.add(ec2Role, 'Workload', 'MySuperWorkload');
    
    // Create SSM managed EC2 instance using the latest AMAZON LINUX AMI
    const awsAMILinux = new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 });
    const ec2InstanceLinux = new ec2.Instance(this, 'LinuxEC2Instance', {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
        machineImage: awsAMILinux,
        securityGroup: sg,
        role: ec2Role,
        vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC}
    });
    Tag.add(ec2InstanceLinux, 'SSMManaged', 'Yes');
    Tag.add(ec2InstanceLinux, 'Name', 'amazonlinux-prod');
    Tag.add(ec2InstanceLinux, 'Shutdown', 'Yes');
    Tag.add(ec2InstanceLinux, 'Startup', 'Yes');
    Tag.add(ec2InstanceLinux, 'OS', 'AmazonLinux');
    Tag.add(ec2InstanceLinux, 'Environment', 'Production');
    Tag.add(ec2InstanceLinux, 'Workload', 'MySuperWorkload');
    Tag.add(ec2InstanceLinux, 'Patch Group', 'Prod-AmazonLinux');

    // Create SSM managed EC2 instance using the latest AMAZON WINDOWS AMI
    const awsAMIWindows = new ec2.WindowsImage(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE);
    const ec2InstanceWindows = new ec2.Instance(this, 'WindowsEC2Instance', {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
        machineImage: awsAMIWindows,
        securityGroup: sg,
        role: ec2Role,
        vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC}
    });
    Tag.add(ec2InstanceWindows, 'SSMManaged', 'Yes');
    Tag.add(ec2InstanceWindows, 'Name', 'windows-prod');
    Tag.add(ec2InstanceWindows, 'Shutdown', 'Yes');
    Tag.add(ec2InstanceWindows, 'Startup', 'Yes');
    Tag.add(ec2InstanceWindows, 'OS', 'Windows');
    Tag.add(ec2InstanceWindows, 'Environment', 'Production');
    Tag.add(ec2InstanceWindows, 'Workload', 'MySuperWorkload');
    Tag.add(ec2InstanceWindows, 'Patch Group', 'Prod-Windows');

    new cdk.CfnOutput(this, "LinuxInstanceId", {value: ec2InstanceLinux.instanceId });
    new cdk.CfnOutput(this, "WindowsInstanceId", {value: ec2InstanceWindows.instanceId });

  }
}