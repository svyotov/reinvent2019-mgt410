#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Mgt410Stack } from '../lib/mgt410-stack';

const app = new cdk.App();
new Mgt410Stack(app, 'Mgt410Stack');
